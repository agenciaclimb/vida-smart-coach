import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { cors } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const { name } = await req.json()
    
    const data = {
      message: `Hello ${name || 'World'}!`,
      timestamp: new Date().toISOString(),
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...headers,
          'Content-Type': 'application/json' 
        } 
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
        status: 400 
      },
    )
  }
})
