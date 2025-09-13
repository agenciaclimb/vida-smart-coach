import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { cors } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    if (req.method === 'POST') {
      const { instance_id, phone_number } = await req.json()
      
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'Instance ID is required' }),
          { 
            headers: { 
              ...headers,
              'Content-Type': 'application/json' 
            }, 
            status: 400 
          },
        )
      }

      const qrData = {
        qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
        instance_id,
        phone_number: phone_number || null,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        status: "pending"
      }
      
      return new Response(
        JSON.stringify({ qr_data: qrData }),
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
