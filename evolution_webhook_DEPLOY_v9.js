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
    console.log('🚀 Evolution Webhook v9 CORRETO - iniciado')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    // ✅ CORREÇÃO v9: Inserir mensagem SEM user_id (campo não existe na tabela)
    const { error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        phone: phoneNumber,
        message: messageContent,
        event: 'messages.upsert',
        timestamp: Date.now()
      })

    if (insertError) {
      console.error('❌ Erro ao inserir mensagem:', insertError)
    } else {
      console.log('✅ Mensagem inserida no banco')
    }

    // Buscar histórico recente (últimas 10 mensagens)
    const { data: recentMessages } = await supabase
      .from('whatsapp_messages')
      .select('message, timestamp')
      .eq('phone', phoneNumber)
      .order('timestamp', { ascending: false })
      .limit(10)

    // Construir contexto do histórico
    let conversationHistory = ''
    if (recentMessages && recentMessages.length > 0) {
      const sortedMessages = recentMessages.reverse() // Ordem cronológica
      conversationHistory = sortedMessages
        .map(msg => `Usuário: ${msg.message}`)
        .join('\n')
    }

    console.log('🧠 Chamando IA Coach v8...')
    
    // ✅ CHAMADA CORRETA para IA Coach v8
    const iaResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: messageContent,
        phone: phoneNumber,
        history: conversationHistory,
        channel: 'whatsapp'
      })
    })

    if (!iaResponse.ok) {
      const errorText = await iaResponse.text()
      console.error('❌ Erro na IA Coach:', iaResponse.status, errorText)
      throw new Error(`IA Coach error: ${iaResponse.status}`)
    }

    const iaData = await iaResponse.json()
    console.log('✅ Resposta da IA:', iaData)

    const responseMessage = iaData.response || iaData.message || 'Desculpe, não consegui processar sua mensagem.'

    // ✅ CORREÇÃO v9: Evolution API com formato CORRETO conforme suas especificações
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') // C26C953E32F8-4223-A0FF-755288E45822
    const evolutionBaseUrl = Deno.env.get('EVOLUTION_BASE_URL')
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME')

    if (!evolutionApiKey || !evolutionBaseUrl || !instanceName) {
      console.error('❌ Variáveis Evolution não configuradas')
      throw new Error('Evolution API não configurada')
    }

    const sendUrl = `${evolutionBaseUrl}/message/sendText/${instanceName}`
    
    console.log('📤 Enviando resposta via Evolution API...')
    console.log('🌐 URL:', sendUrl)
    console.log('🔑 Token:', evolutionApiKey.substring(0, 8) + '...')
    
    // ✅ FORMATO EVOLUTION API CORRETO:
    // - Header: "apikey" com token da instância
    // - Body: "text" (não "message") e "number" 
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey  // ✅ Header correto conforme suas especificações
      },
      body: JSON.stringify({
        number: phoneNumber,  // Só o número sem @s.whatsapp.net
        text: responseMessage  // ✅ CORREÇÃO: "text" em vez de "message"
      })
    })

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text()
      console.error('❌ Erro ao enviar mensagem:', sendResponse.status, errorText)
      console.error('📋 Response headers:', Object.fromEntries(sendResponse.headers.entries()))
      throw new Error(`Evolution API error: ${sendResponse.status}`)
    }

    const sendData = await sendResponse.json()
    console.log('✅ Mensagem enviada com sucesso:', sendData)

    return new Response(JSON.stringify({ 
      status: 'success',
      messageProcessed: true,
      iaResponse: responseMessage,
      evolutionResponse: sendData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Erro geral no webhook:', error)
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