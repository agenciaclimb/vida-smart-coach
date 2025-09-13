import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { cors } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
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
            ...headers,
            'Content-Type': 'application/json' 
          } 
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { 
          ...headers,
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
          ...headers,
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      },
    )
  }
})
