// 🌅 SISTEMA DE CHECK-INS AUTOMÁTICOS IA COACH
// Edge Function para notificações matinais (7h-9h) e noturnas (20h-22h)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { type } = await req.json()

    // Tipos: 'morning_checkin' ou 'night_checkin'
    if (type === 'morning_checkin') {
      await handleMorningCheckin(supabaseClient)
    } else if (type === 'night_checkin') {
      await handleNightCheckin(supabaseClient)
    } else if (type === 'send_checkin_reminder') {
      await sendCheckinReminder(supabaseClient)
    }

    return new Response(
      JSON.stringify({ success: true, message: `${type} processado com sucesso` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no sistema de check-ins:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleMorningCheckin(supabase) {
  console.log('🌅 Iniciando check-ins matinais...')

  // Buscar usuários ativos no sistema IA Coach
  const { data: activeUsers, error } = await supabase
    .from('client_stages')
    .select(`
      user_id,
      current_stage,
      stage_metadata,
      bant_score
    `)
    .not('user_id', 'is', null)

  if (error) {
    console.error('Erro ao buscar usuários ativos:', error)
    return
  }

  console.log(`📋 Encontrados ${activeUsers.length} usuários ativos`)

  for (const userStage of activeUsers) {
    try {
      // Verificar se já fez check-in hoje
      const today = new Date().toISOString().split('T')[0]
      const { data: existingCheckin } = await supabase
        .from('interactions')
        .select('id')
        .eq('user_id', userStage.user_id)
        .eq('interaction_type', 'morning_checkin')
        .gte('created_at', `${today}T00:00:00`)
        .single()

      if (existingCheckin) {
        console.log(`⚠️ Usuário ${userStage.user_id} já fez check-in matinal hoje`)
        continue
      }

      // Personalizar mensagem baseada no estágio
      const morningMessages = {
        sdr: '🌅 Bom dia! Como você está se sentindo hoje? Vamos começar o dia com energia!',
        specialist: '🧠 Bom dia! Pronto para focar nas suas 4 áreas de transformação hoje?',
        seller: '🎯 Bom dia! Que tal revisar seus objetivos e conquistar suas metas hoje?',
        partner: '❤️ Bom dia, parceiro! Juntos vamos fazer deste um dia incrível de evolução!'
      }

      const message = morningMessages[userStage.current_stage] || morningMessages.sdr

      // Registrar check-in matinal automático
      await supabase
        .from('interactions')
        .insert({
          user_id: userStage.user_id,
          interaction_type: 'morning_checkin',
          stage: userStage.current_stage,
          content: 'Check-in matinal automático do sistema',
          ai_response: message,
          metadata: {
            automated: true,
            checkin_time: 'morning',
            stage_context: userStage.stage_metadata,
            timestamp: new Date().toISOString()
          }
        })

      // Adicionar pontos de gamificação pelo check-in
      await supabase
        .from('gamification')
        .insert({
          user_id: userStage.user_id,
          stage: userStage.current_stage,
          action_type: 'morning_checkin',
          points: 15,
          badges: ['🌅 Madrugador'],
          streak_days: 1, // Será calculado corretamente pelo hook
          metadata: {
            automated: true,
            checkin_type: 'morning',
            message_sent: message
          }
        })

      console.log(`✅ Check-in matinal enviado para usuário ${userStage.user_id}`)

    } catch (userError) {
      console.error(`Erro no check-in matinal para usuário ${userStage.user_id}:`, userError)
    }
  }

  console.log('🌅 Check-ins matinais finalizados')
}

async function handleNightCheckin(supabase) {
  console.log('🌙 Iniciando check-ins noturnos...')

  // Buscar usuários ativos no sistema IA Coach
  const { data: activeUsers, error } = await supabase
    .from('client_stages')
    .select(`
      user_id,
      current_stage,
      stage_metadata,
      bant_score
    `)
    .not('user_id', 'is', null)

  if (error) {
    console.error('Erro ao buscar usuários ativos:', error)
    return
  }

  for (const userStage of activeUsers) {
    try {
      // Verificar se já fez check-in noturno hoje
      const today = new Date().toISOString().split('T')[0]
      const { data: existingCheckin } = await supabase
        .from('interactions')
        .select('id')
        .eq('user_id', userStage.user_id)
        .eq('interaction_type', 'night_checkin')
        .gte('created_at', `${today}T00:00:00`)
        .single()

      if (existingCheckin) {
        console.log(`⚠️ Usuário ${userStage.user_id} já fez check-in noturno hoje`)
        continue
      }

      // Personalizar mensagem baseada no estágio
      const nightMessages = {
        sdr: '🌙 Como foi seu dia? Conte-me sobre seus progressos e desafios!',
        specialist: '🧘 Hora de refletir: como foram suas práticas nas 4 áreas hoje?',
        seller: '📊 Vamos avaliar: quais metas você conquistou hoje? O que pode melhorar amanhã?',
        partner: '🌟 Parabéns pelo dia! Que conquistas você celebra hoje?'
      }

      const message = nightMessages[userStage.current_stage] || nightMessages.sdr

      // Registrar check-in noturno automático
      await supabase
        .from('interactions')
        .insert({
          user_id: userStage.user_id,
          interaction_type: 'night_checkin',
          stage: userStage.current_stage,
          content: 'Check-in noturno automático do sistema',
          ai_response: message,
          metadata: {
            automated: true,
            checkin_time: 'night',
            stage_context: userStage.stage_metadata,
            timestamp: new Date().toISOString()
          }
        })

      // Adicionar pontos de gamificação pelo check-in
      await supabase
        .from('gamification')
        .insert({
          user_id: userStage.user_id,
          stage: userStage.current_stage,
          action_type: 'night_checkin',
          points: 15,
          badges: ['🌙 Reflexivo'],
          streak_days: 1,
          metadata: {
            automated: true,
            checkin_type: 'night',
            message_sent: message
          }
        })

      console.log(`✅ Check-in noturno enviado para usuário ${userStage.user_id}`)

    } catch (userError) {
      console.error(`Erro no check-in noturno para usuário ${userStage.user_id}:`, userError)
    }
  }

  console.log('🌙 Check-ins noturnos finalizados')
}

async function sendCheckinReminder(supabase) {
  console.log('🔔 Enviando lembretes de check-in...')

  // Buscar usuários que não fizeram check-in hoje
  const today = new Date().toISOString().split('T')[0]
  
  const { data: activeUsers, error } = await supabase
    .from('client_stages')
    .select('user_id, current_stage')
    .not('user_id', 'is', null)

  if (error) {
    console.error('Erro ao buscar usuários:', error)
    return
  }

  for (const user of activeUsers) {
    try {
      // Verificar se fez algum check-in hoje
      const { data: todayCheckins } = await supabase
        .from('interactions')
        .select('id')
        .eq('user_id', user.user_id)
        .in('interaction_type', ['morning_checkin', 'night_checkin'])
        .gte('created_at', `${today}T00:00:00`)

      if (!todayCheckins || todayCheckins.length === 0) {
        // Enviar lembrete
        await supabase
          .from('interactions')
          .insert({
            user_id: user.user_id,
            interaction_type: 'checkin_reminder',
            stage: user.current_stage,
            content: 'Lembrete de check-in automático',
            ai_response: '🔔 Oi! Notei que você ainda não fez seu check-in hoje. Como está se sentindo? Vamos conversar!',
            metadata: {
              automated: true,
              reminder_type: 'daily_checkin',
              timestamp: new Date().toISOString()
            }
          })

        console.log(`🔔 Lembrete enviado para usuário ${user.user_id}`)
      }
    } catch (userError) {
      console.error(`Erro no lembrete para usuário ${user.user_id}:`, userError)
    }
  }

  console.log('🔔 Lembretes finalizados')
}