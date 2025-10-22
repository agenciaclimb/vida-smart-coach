// Script simplificado para testar Specialist
const SUPABASE_URL = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const userId = '45ba22ad-4ba2-46a3-b827-ebe682a00e72';

// Ler secrets do arquivo
import { readFileSync } from 'fs';
const serviceKey = readFileSync('./SUPABASE_SERVICE_ROLE_KEY.txt', 'utf8').trim();
const internalSecret = readFileSync('./INTERNAL_FUNCTION_SECRET.txt', 'utf8').trim();

async function testSpecialist() {
  console.log('🧪 Testando Specialist com correção de bug\n');

  // Simular 3 mensagens no histórico (já está no Specialist)
  const chatHistory = [
    { role: 'assistant', content: 'Como está sua área física?' },
    { role: 'user', content: 'Me sinto sedentário' },
    { role: 'assistant', content: 'E sua alimentação?' },
    { role: 'user', content: 'Preciso melhorar' },
    { role: 'assistant', content: 'Como está seu emocional?' },
    { role: 'user', content: 'Estressado' }
  ];

  // Mensagem que deve fazer avançar
  const testMessage = 'Quero ajuda com isso';

  console.log('📤 Enviando mensagem:', testMessage);
  console.log('📊 Histórico:', chatHistory.length, 'mensagens');
  console.log('🎯 Esperado: Avançar para SELLER após 3 perguntas\n');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ia-coach-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'X-Internal-Secret': internalSecret
    },
    body: JSON.stringify({
      messageContent: testMessage,
      userProfile: { 
        id: userId, 
        full_name: 'Jeferson Costa' 
      },
      chatHistory
    })
  });

  const data = await response.json();
  
  console.log('📥 Resposta IA:');
  console.log('   Stage:', data.stage);
  console.log('   Reply:', data.reply);
  console.log('');

  if (data.stage === 'seller') {
    console.log('✅ TESTE PASSOU! Specialist avançou para Seller após 3 perguntas');
    console.log('🔗 Link de cadastro deve estar na resposta:', data.reply.includes('appvidasmart.com') ? '✅' : '❌');
  } else if (data.stage === 'specialist') {
    console.log('⚠️ Ainda no Specialist. Histórico pode ser insuficiente.');
  } else {
    console.log('❌ Stage inesperado:', data.stage);
  }
}

testSpecialist().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
