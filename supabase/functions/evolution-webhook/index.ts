import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 405 
        }
      )
    }

    const body = await req.json().catch(() => ({}))
    console.log("Evolution webhook received:", JSON.stringify(body, null, 2))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { 
      event,
      instance, 
      data,
      destination,
      messageType,
      message 
    } = body

    if (!data || event !== 'messages.upsert') {
      console.log("Not a messages.upsert event or missing data:", { event, hasData: !!data })
      return new Response(
        JSON.stringify({ 
          ok: true, 
          received: true,
          message: "Webhook received but not a processable message event" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    const phoneNumber = data.key?.remoteJid || destination
    const messageContent = data.message?.conversation || 
                          data.message?.extendedTextMessage?.text ||
                          message?.text ||
                          'Mensagem não suportada'
    
    if (data.key?.fromMe) {
      console.log("Skipping message from bot itself")
      return new Response(
        JSON.stringify({ 
          ok: true, 
          received: true,
          message: "Message from bot itself, skipped" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    const { error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        phone_number: phoneNumber,
        message_content: messageContent,
        message_type: data.messageType || messageType || 'text',
        webhook_data: body,
        received_at: new Date().toISOString(),
        instance_id: instance
      })

    if (saveError) {
      console.error("Error saving message:", saveError)
    }

    if (messageContent && messageContent !== 'Mensagem não suportada') {
      try {
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (openaiKey) {
          const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: 'Você é o Vida Smart Coach, um assistente de IA especializado em wellness e saúde. Responda de forma amigável, motivadora e com dicas práticas sobre saúde física, alimentação, bem-estar emocional e crescimento espiritual. Mantenha as respostas concisas e úteis.'
                },
                {
                  role: 'user',
                  content: messageContent
                }
              ],
              max_tokens: 500,
              temperature: 0.7
            })
          })

          if (aiResponse.ok) {
            const aiData = await aiResponse.json()
            const aiMessage = aiData.choices[0]?.message?.content

            if (aiMessage) {
              const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
              const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')
              const instanceId = Deno.env.get('EVOLUTION_INSTANCE_ID')

              if (evolutionUrl && evolutionKey && instanceId) {
                const sendResponse = await fetch(`${evolutionUrl}/message/sendText/${instanceId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': evolutionKey
                  },
                  body: JSON.stringify({
                    number: phoneNumber,
                    text: aiMessage
                  })
                })

                if (sendResponse.ok) {
                  console.log("AI response sent successfully")
                  
                  await supabase
                    .from('whatsapp_messages')
                    .insert({
                      phone_number: phoneNumber,
                      message_content: aiMessage,
                      message_type: 'ai_response',
                      webhook_data: { ai_response: true },
                      received_at: new Date().toISOString(),
                      instance_id: instance
                    })
                } else {
                  console.error("Failed to send AI response:", await sendResponse.text())
                }
              }
            }
          }
        }
      } catch (aiError) {
        console.error("AI processing error:", aiError)
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        received: true,
        message: "Webhook processed successfully",
        processed_message: messageContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error("Evolution webhook error:", error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error.message || "Internal server error" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
