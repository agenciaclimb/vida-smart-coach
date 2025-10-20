const { config } = require('dotenv')

// Carregar variáveis
config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/evolution-webhook`
const EVOLUTION_WEBHOOK_TOKEN = process.env.EVOLUTION_WEBHOOK_TOKEN
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

console.log('🚀 === TESTE WEBHOOK DEPLOYADO ===')
console.log('📍 URL:', WEBHOOK_URL)
console.log('🔑 Token:', EVOLUTION_WEBHOOK_TOKEN ? 'Configurado' : 'Não encontrado')

// Payload de teste
const testPayload = {
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5516981459950@s.whatsapp.net",
      "id": `test-deployed-${Date.now()}`,
      "fromMe": false
    },
    "message": {
      "conversation": `Teste webhook deployado com IA - ${new Date().toLocaleTimeString()}`
    }
  }
}

console.log('📦 Payload:', JSON.stringify(testPayload, null, 2))

async function testWebhook() {
  try {
    console.log('\n🚀 Tentativa 1: Sem headers especiais...')
    
    let response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })
    
    console.log('📊 Status:', response.status)
    
    if (response.status === 401) {
      console.log('\n🔄 Tentativa 2: Com ANON key...')
      
      response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(testPayload)
      })
      
      console.log('📊 Status com ANON:', response.status)
    }
    
    if (response.status === 401 && EVOLUTION_WEBHOOK_TOKEN) {
      console.log('\n🔄 Tentativa 3: Com webhook token...')
      
      response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': EVOLUTION_WEBHOOK_TOKEN
        },
        body: JSON.stringify(testPayload)
      })
      
      console.log('📊 Status com token:', response.status)
    }
    
    console.log('📊 Status Text:', response.statusText)
    
    const responseText = await response.text()
    console.log('📄 Response:', responseText)
    
    if (response.ok) {
      try {
        const responseJson = JSON.parse(responseText)
        
        if (responseJson.ok && responseJson.received) {
          console.log('✅ SUCESSO! Webhook funcionando!')
        } else {
          console.log('⚠️ Resposta inesperada:', responseJson)
        }
        
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido')
      }
    } else {
      console.error('❌ Erro no webhook:', response.status, responseText)
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message)
  }
}

testWebhook()
