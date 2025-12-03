// Edge Function: challenge-manager
// Responsável por criar e gerenciar desafios automáticos (semanais, mensais, sazonais)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Challenge {
  name: string
  description: string
  event_type: 'challenge'
  category: 'weekly' | 'monthly' | 'seasonal'
  start_date: string
  end_date: string
  requirements: {
    type: string
    target: number
    metric?: string
  }
  rewards: {
    xp: number
    badge_code?: string
  }
  bonus_multiplier: number
  max_participants?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    if (action === 'generate_weekly') {
      const challenge = await generateWeeklyChallenge()
      const { data, error } = await supabaseClient
        .from('gamification_events')
        .insert(challenge)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, challenge: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'generate_monthly') {
      const challenge = await generateMonthlyChallenge()
      const { data, error } = await supabaseClient
        .from('gamification_events')
        .insert(challenge)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, challenge: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'check_progress') {
      const { user_id, event_id } = await req.json()
      
      // Buscar participação do usuário
      const { data: participation, error: partError } = await supabaseClient
        .from('user_event_participation')
        .select('*, gamification_events(*)')
        .eq('user_id', user_id)
        .eq('event_id', event_id)
        .single()

      if (partError) throw partError

      // Calcular progresso baseado no tipo de desafio
      const progress = await calculateProgress(supabaseClient, user_id, participation.gamification_events)
      
      // Atualizar progresso
      const { error: updateError } = await supabaseClient
        .from('user_event_participation')
        .update({ current_progress: progress })
        .eq('id', participation.id)

      if (updateError) throw updateError

      // Verificar se completou
      if (checkCompletion(progress, participation.gamification_events.requirements)) {
        await completeChallenge(supabaseClient, participation.id, participation.gamification_events)
      }

      return new Response(
        JSON.stringify({ success: true, progress }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateWeeklyChallenge(): Challenge {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Segunda-feira
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const challenges = [
    {
      name: '7 Dias de Movimento',
      description: 'Complete pelo menos 1 atividade física por dia durante 7 dias consecutivos',
      requirements: { type: 'daily_streak', target: 7, metric: 'physical_activities' },
      rewards: { xp: 500, badge_code: 'seven_day_warrior' },
      bonus_multiplier: 1.5
    },
    {
      name: 'Campeão da Hidratação',
      description: 'Atinja sua meta de água todos os dias desta semana',
      requirements: { type: 'daily_streak', target: 7, metric: 'water_intake' },
      rewards: { xp: 400, badge_code: 'hydration_hero' },
      bonus_multiplier: 1.3
    },
    {
      name: 'Mestre da Consistência',
      description: 'Faça check-in diário em todos os 4 pilares por 7 dias',
      requirements: { type: 'complete_checkins', target: 28 }, // 4 pilares x 7 dias
      rewards: { xp: 750, badge_code: 'consistency_master' },
      bonus_multiplier: 2.0
    }
  ]

  const selected = challenges[Math.floor(Math.random() * challenges.length)]

  return {
    ...selected,
    event_type: 'challenge',
    category: 'weekly',
    start_date: startOfWeek.toISOString(),
    end_date: endOfWeek.toISOString(),
    max_participants: undefined
  }
}

function generateMonthlyChallenge(): Challenge {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const challenges = [
    {
      name: 'Guerreiro dos 30 Dias',
      description: 'Acumule 10.000 pontos de XP durante este mês',
      requirements: { type: 'total_xp', target: 10000 },
      rewards: { xp: 2000, badge_code: 'monthly_warrior' },
      bonus_multiplier: 1.5
    },
    {
      name: 'Maratonista Mensal',
      description: 'Complete 20 treinos físicos neste mês',
      requirements: { type: 'activity_count', target: 20, metric: 'physical_activities' },
      rewards: { xp: 1500, badge_code: 'marathon_master' },
      bonus_multiplier: 1.4
    },
    {
      name: 'Transformação Total',
      description: 'Complete 80% dos seus planos dos 4 pilares este mês',
      requirements: { type: 'plan_completion', target: 80 }, // percentual
      rewards: { xp: 3000, badge_code: 'total_transformation' },
      bonus_multiplier: 2.5
    }
  ]

  const selected = challenges[Math.floor(Math.random() * challenges.length)]

  return {
    ...selected,
    event_type: 'challenge',
    category: 'monthly',
    start_date: startOfMonth.toISOString(),
    end_date: endOfMonth.toISOString(),
    max_participants: undefined
  }
}

async function calculateProgress(
  supabase: any,
  userId: string,
  event: any
): Promise<any> {
  const { requirements, start_date, end_date } = event
  const { type, target, metric } = requirements

  if (type === 'daily_streak') {
    // Contar dias consecutivos com atividade do tipo especificado
    const { data: activities } = await supabase
      .from('daily_activities')
      .select('activity_date')
      .eq('user_id', userId)
      .gte('activity_date', start_date)
      .lte('activity_date', end_date)
      .eq('activity_type', metric?.replace('_activities', ''))
      .order('activity_date', { ascending: false })

    const streak = calculateStreak(activities?.map((a: any) => a.activity_date) || [])
    return { current: streak, target, percent: Math.min((streak / target) * 100, 100) }
  }

  if (type === 'total_xp') {
    const { data: stats } = await supabase
      .from('user_gamification_summary')
      .select('total_points')
      .eq('user_id', userId)
      .single()

    const current = stats?.total_points || 0
    return { current, target, percent: Math.min((current / target) * 100, 100) }
  }

  if (type === 'activity_count') {
    const { count } = await supabase
      .from('daily_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('activity_date', start_date)
      .lte('activity_date', end_date)
      .eq('activity_type', metric?.replace('_activities', ''))

    return { current: count || 0, target, percent: Math.min(((count || 0) / target) * 100, 100) }
  }

  if (type === 'complete_checkins') {
    const { count } = await supabase
      .from('daily_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start_date)
      .lte('created_at', end_date)

    return { current: count || 0, target, percent: Math.min(((count || 0) / target) * 100, 100) }
  }

  return { current: 0, target, percent: 0 }
}

function calculateStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0
  
  const sortedDates = dates.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime())
  let streak = 1
  
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diff = Math.floor((sortedDates[i].getTime() - sortedDates[i + 1].getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

function checkCompletion(progress: any, requirements: any): boolean {
  return progress.current >= requirements.target
}

async function completeChallenge(supabase: any, participationId: string, event: any) {
  const { rewards } = event
  
  // Marcar como completado
  await supabase
    .from('user_event_participation')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      points_earned: rewards.xp
    })
    .eq('id', participationId)

  // Adicionar XP ao usuário (através da função existente)
  const { data: participation } = await supabase
    .from('user_event_participation')
    .select('user_id')
    .eq('id', participationId)
    .single()

  if (participation) {
    await supabase.rpc('add_user_xp', {
      p_user_id: participation.user_id,
      p_points: rewards.xp,
      p_source: 'challenge_completion'
    })

    // Se tiver badge associado, conceder achievement
    if (rewards.badge_code) {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('code', rewards.badge_code)
        .single()

      if (achievement) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: participation.user_id,
            achievement_id: achievement.id
          })
          .onConflict('user_id,achievement_id')
          .ignoreDuplicates()
      }
    }
  }
}
