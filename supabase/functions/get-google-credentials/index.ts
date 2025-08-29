import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://appvidasmart.com.br, https://cliente.appvidasmart.com.br, https://parceiro.appvidasmart.com.br, https://admin.appvidasmart.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'GET') {
      const credentials = {
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') || 'your-google-client-id',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ? '[REDACTED]' : 'not-configured',
        redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:3000/auth/callback',
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
      }
      
      return new Response(
        JSON.stringify({ credentials }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }, 
        status: 405 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      },
    )
  }
})
