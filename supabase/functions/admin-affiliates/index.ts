import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cors } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado." }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido." }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    const affiliates = [
      { id: 1, name: "João Silva", email: "joao@example.com", commission: 10 },
      { id: 2, name: "Maria Santos", email: "maria@example.com", commission: 15 }
    ]

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: user.id,
        affiliates 
      }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }
})
