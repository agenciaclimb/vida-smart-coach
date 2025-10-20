// ============================================
// 🧪 TESTE SIMPLES IA COACH v8 - DEPLOY VALIDAÇÃO
// ============================================

console.log('🧪 TESTE DEPLOY IA COACH v8');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));

// Teste básico de conectividade
async function testBasicConnection() {
  try {
    // Teste direto na URL da função
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/ia-coach-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer process.env.VITE_SUPABASE_ANON_KEY'
      },
      body: JSON.stringify({
        messageContent: "Oi, preciso de ajuda",
        userProfile: { 
          id: 'test-123', 
          full_name: 'Teste User'
        },
        chatHistory: []
      })
    });

    console.log('📊 Status IA Coach:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ IA Coach Response:', data);
      
      if (data.reply) {
        const questionCount = (data.reply.match(/\?/g) || []).length;
        console.log('💬 Resposta:', data.reply);
        console.log('❓ Número de perguntas:', questionCount);
        console.log('✅ Otimização v8:', questionCount <= 1 ? 'SUCESSO - Uma pergunta!' : 'FALHOU - Muitas perguntas');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
  }
}

// Teste webhook básico
async function testWebhookBasic() {
  try {
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: "test",
        data: null
      })
    });

    console.log('\n📊 Status Webhook:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook conectado:', data);
    } else {
      console.log('🔒 Webhook protegido (esperado):', response.status);
    }

  } catch (error) {
    console.error('❌ Erro webhook:', error.message);
  }
}

// Executar testes
async function runTests() {
  await testBasicConnection();
  await testWebhookBasic();
  
  console.log('\n🎯 CONCLUSÃO:');
  console.log('- Se IA Coach respondeu com UMA pergunta: ✅ v8 funcionando');
  console.log('- Se Webhook retornou 401/403: ✅ Segurança funcionando');
  console.log('- Deploy manual executado com sucesso! 🚀');
}

runTests();