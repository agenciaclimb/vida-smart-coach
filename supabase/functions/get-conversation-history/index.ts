import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { phone_number, limit = 50 } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )
  
  const { data: conversations } = await supabase
    .from('conversation_history')
    .select('*')
    .eq('phone_number', phone_number)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return new Response(JSON.stringify({
    conversations: conversations?.reverse() || []
  }), {
    headers: { "Content-Type": "application/json" }
  })
})
