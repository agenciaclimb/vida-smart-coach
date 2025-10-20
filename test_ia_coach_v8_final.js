// ============================================
// 🧪 TESTE IA COACH v8 COM HISTÓRICO - DEPLOY FINAL
// Data: 18/10/2025
// ============================================

const SUPABASE_URL = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI2MzM5MTEsImV4cCI6MjAzODIwOTkxMX0.2OxJllQx-1nhu5fCy71N36CIiJ5tQuJWGtDnOl64RoQ';

async function testIACoachV8() {
  console.log('🎯 TESTANDO IA COACH v8 COM HISTÓRICO...\n');

  const testPayload = {
    messageContent: "Oi, tenho lutado com a ansiedade ultimamente",
    userProfile: {
      id: "test-user-uuid",
      full_name: "João Teste"
    },
    chatHistory: [
      { role: 'user', content: 'Olá!' },
      { role: 'assistant', content: 'Oi João! Como posso ajudar você hoje?' },
      { role: 'user', content: 'Estou me sentindo muito cansado' },
      { role: 'assistant', content: 'Entendo, João. O cansaço tem afetado seu dia a dia?' }
    ]
  };

  try {
    console.log('📤 Enviando requisição para IA Coach...');
    console.log('💬 Mensagem:', testPayload.messageContent);
    console.log('👤 Usuário:', testPayload.userProfile.full_name);
    console.log('📜 Histórico:', testPayload.chatHistory.length, 'mensagens anteriores');
    console.log('');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📊 Status da Resposta:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ IA COACH RESPONSE:', JSON.stringify(data, null, 2));
      
      // Verificar se a resposta está no formato v8 otimizado
      if (data.reply) {
        console.log('\n🎉 SUCESSO! IA Coach v8 funcionando!');
        console.log('💬 Resposta da IA:', data.reply);
        console.log('🎯 Estágio atual:', data.stage);
        console.log('🤖 Modelo:', data.model);
        console.log('⏰ Timestamp:', data.timestamp);
        
        // Verificar se a resposta usa "uma pergunta por vez"
        const hasMultipleQuestions = (data.reply.match(/\?/g) || []).length > 1;
        const hasLists = data.reply.includes('- ') || data.reply.includes('1.') || data.reply.includes('2.');
        
        console.log('\n🔍 ANÁLISE UX v8:');
        console.log('✅ Uma pergunta por vez:', !hasMultipleQuestions ? 'SIM' : 'NÃO ⚠️');
        console.log('✅ Sem listas:', !hasLists ? 'SIM' : 'NÃO ⚠️');
        console.log('✅ Tom natural:', data.reply.includes('João') ? 'SIM' : 'PARCIAL');
        
        if (!hasMultipleQuestions && !hasLists) {
          console.log('\n🚀 OTIMIZAÇÕES v8 CONFIRMADAS! Sistema funcionando perfeitamente.');
        } else {
          console.log('\n⚠️ Atenção: Algumas otimizações v8 podem precisar de ajuste.');
        }
        
      } else {
        console.log('❌ Resposta em formato inesperado');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ ERRO NA RESPOSTA:');
      console.log('Status:', response.status);
      console.log('Texto:', errorText);
    }

  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO:', error.message);
  }
}

// Executar teste
testIACoachV8().then(() => {
  console.log('\n✅ Teste concluído.');
}).catch(console.error);