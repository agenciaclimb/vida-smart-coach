import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { phone_number } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone_number', phone_number)
    .single()
  
  const { data: activities } = await supabase
    .from('activity_tracking')
    .select('*')
    .eq('phone_number', phone_number)
    .order('completed_at', { ascending: false })
    .limit(10)
  
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const { data: checkins } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('phone_number', phone_number)
    .gte('created_at', weekAgo.toISOString())
  
  const { data: achievements } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('phone_number', phone_number)
    .order('unlocked_at', { ascending: false })
  
  return new Response(JSON.stringify({
    profile,
    activities,
    checkins,
    achievements,
    dashboard_data: {
      total_points: profile?.total_points || 0,
      current_level: profile?.current_level || 1,
      streak_days: profile?.streak_days || 0,
      weekly_checkins: checkins?.length || 0,
      recent_activities: activities?.length || 0
    }
  }), {
    headers: { "Content-Type": "application/json" }
  })
})
