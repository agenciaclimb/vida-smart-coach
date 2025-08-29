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
    if (req.method === 'POST') {
      const { instance_id, phone_number } = await req.json()
      
      if (!instance_id) {
        return new Response(
          JSON.stringify({ error: 'Instance ID is required' }),
          { 
            headers: { 
              ...corsHeaders,
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
