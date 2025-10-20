import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Evolution Webhook v9.1 - CORREÇÃO JWT')
    
    // ✅ CORREÇÃO JWT: Usar SERVICE_ROLE_KEY para operações internas
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Cliente com SERVICE_ROLE para operações de banco
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    console.log('📥 Webhook body recebido:', JSON.stringify(body, null, 2))

    // Verificar se é mensagem de texto
    if (body.event !== 'messages.upsert' || !body.data?.key?.remoteJid || !body.data?.message?.conversation) {
      console.log('⏭️ Evento ignorado - não é mensagem de texto')
      return new Response(JSON.stringify({ status: 'ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const phoneNumber = body.data.key.remoteJid.replace('@s.whatsapp.net', '')
    const messageContent = body.data.message.conversation
    const messageId = body.data.key.id
    
    console.log(`📱 Mensagem de ${phoneNumber}: ${messageContent}`)

    // ✅ CORREÇÃO: Usar estrutura REAL da tabela whatsapp_messages
    const { error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        phone_number: body.data.key.remoteJid, // Manter formato completo
        message_content: messageContent,
        message_type: 'text',
        received_at: new Date().toISOString(),
        webhook_data: body,
        instance_id: 'vida-smart-coach'
      })

    if (insertError) {
      console.error('❌ Erro ao inserir mensagem:', insertError)
    } else {
      console.log('✅ Mensagem inserida no banco')
    }

    // ✅ CORREÇÃO: Buscar histórico com campos reais da tabela
    const { data: recentMessages } = await supabase
      .from('whatsapp_messages')
      .select('message_content, received_at')
      .eq('phone_number', body.data.key.remoteJid) // Usar formato completo
      .order('received_at', { ascending: false })
      .limit(10)

    // ✅ CORREÇÃO: Construir contexto com campos corretos da tabela
    let conversationHistory = ''
    if (recentMessages && recentMessages.length > 0) {
      const sortedMessages = recentMessages.reverse() // Ordem cronológica
      conversationHistory = sortedMessages
        .map(msg => `Usuário: ${msg.message_content}`) // ✅ message_content
        .join('\n')
    }

    console.log('🧠 Chamando IA Coach v8 com SERVICE_ROLE...')
    
    // ✅ CORREÇÃO: Usar formato correto para IA Coach v8
    const iaResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,  // ✅ SERVICE_ROLE em vez de ANON
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageContent: messageContent,  // ✅ messageContent em vez de message
        userProfile: { 
          id: 'whatsapp-user', 
          full_name: `Usuário WhatsApp ${phoneNumber.slice(-4)}`,
          phone: phoneNumber 
        },
        chatHistory: conversationHistory ? [{ 
          role: 'user', 
          content: conversationHistory,
          created_at: new Date().toISOString()
        }] : [],
        channel: 'whatsapp'
      })
    })

    if (!iaResponse.ok) {
      const errorText = await iaResponse.text()
      console.error('❌ Erro na IA Coach:', iaResponse.status, errorText)
      
      // ✅ FALLBACK: Se IA falhar, enviar mensagem padrão
      const fallbackMessage = 'Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?'
      
      await sendWhatsAppMessage(phoneNumber, fallbackMessage)
      
      return new Response(JSON.stringify({ 
        status: 'success_with_fallback',
        message: 'IA Coach indisponível, mensagem padrão enviada'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const iaData = await iaResponse.json()
    console.log('✅ Resposta da IA:', iaData)

    const responseMessage = iaData.reply || iaData.response || iaData.message || 'Desculpe, não consegui processar sua mensagem.'

    // Enviar resposta via Evolution API
    await sendWhatsAppMessage(phoneNumber, responseMessage)

    return new Response(JSON.stringify({ 
      status: 'success',
      messageProcessed: true,
      iaResponse: responseMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Erro geral no webhook:', error)
    
    // ✅ FALLBACK DE EMERGÊNCIA: Sempre responder algo
    try {
      const phoneNumber = body?.data?.key?.remoteJid?.replace('@s.whatsapp.net', '')
      if (phoneNumber) {
        await sendWhatsAppMessage(phoneNumber, 'Olá! Estou com problemas técnicos temporários. Tente novamente em alguns minutos.')
      }
    } catch (fallbackError) {
      console.error('💥 Erro no fallback:', fallbackError)
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error',
      timestamp: Date.now()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ✅ Função auxiliar para enviar mensagem WhatsApp
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // ✅ CORREÇÃO: Usar nomes corretos das variáveis do .env.local
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')  // ✅ API_URL não BASE_URL
    const evolutionInstanceId = Deno.env.get('EVOLUTION_INSTANCE_ID')  // ✅ INSTANCE_ID não NAME

    if (!evolutionApiKey || !evolutionApiUrl || !evolutionInstanceId) {
      console.error('❌ Variáveis Evolution não configuradas')
      console.error('API_KEY:', evolutionApiKey ? 'OK' : 'MISSING')
      console.error('API_URL:', evolutionApiUrl ? 'OK' : 'MISSING') 
      console.error('INSTANCE_ID:', evolutionInstanceId ? 'OK' : 'MISSING')
      throw new Error('Evolution API não configurada')
    }

    // ✅ CORREÇÃO Evolution API: Usar INSTANCE_ID na URL
    const sendUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstanceId}`
    
    // ✅ CORREÇÃO Evolution API: Limpar número (só DDI+DDD+NUMERO)
    const cleanNumber = phoneNumber.replace(/[@s\.whatsapp\.net]/g, '')
    
    console.log('📤 Enviando resposta via Evolution API...')
    console.log('🌐 URL:', sendUrl)
    console.log('📱 Número limpo:', cleanNumber)
    console.log('📝 Mensagem:', message)
    
    const payload = {
      number: cleanNumber,  // ✅ Só números: 5516981459950
      text: message         // ✅ FORMATO CORRETO conforme suporte
    }
    
    console.log('📦 Payload Evolution:', JSON.stringify(payload, null, 2))
    
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey  // ✅ Header correto conforme suporte
      },
      body: JSON.stringify(payload)
    })

    console.log('📥 Evolution Response Status:', sendResponse.status)
    console.log('📥 Evolution Response Headers:', Object.fromEntries(sendResponse.headers.entries()))

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text()
      console.error('❌ Erro Evolution API:', sendResponse.status, errorText)
      throw new Error(`Evolution API error: ${sendResponse.status} - ${errorText}`)
    }

    const sendData = await sendResponse.json()
    console.log('✅ Mensagem enviada com sucesso:', sendData)
    
    return sendData
  } catch (error) {
    console.error('💥 Erro ao enviar WhatsApp:', error)
    throw error
  }
}