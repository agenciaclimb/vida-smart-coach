import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { cors } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    if (req.method === 'GET') {
      const activeProvider = {
        id: "provider_001",
        name: "Vida Smart Provider",
        status: "active",
        services: ["health_tracking", "ai_coaching", "nutrition_planning"],
        last_updated: new Date().toISOString()
      }
      
      return new Response(
        JSON.stringify({ provider: activeProvider }),
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
