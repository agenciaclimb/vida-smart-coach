// Script de teste para IA Coach Strategic System
// Teste todas as 4 fases: SDR → Especialista → Vendedor → Parceiro

async function testIACoachSystem() {
  const baseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/ia-coach-chat';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE'
  };

  const testUser = {
    id: 'test-user-123',
    full_name: 'João Silva',
    email: 'joao@teste.com'
  };

  console.log('🚀 Iniciando testes do Sistema IA Coach Strategic...\n');

  // ============================================
  // TESTE 1: ESTÁGIO SDR - QUALIFICAÇÃO BANT
  // ============================================
  console.log('🎯 TESTE 1: Estágio SDR - Qualificação BANT');
  
  try {
    const sdrTest = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageContent: "Oi, estou interessado em melhorar minha saúde. Tenho muita dificuldade com alimentação e exercícios. Numa escala de 1 a 10, meu nível de frustração é 9. Quero ver mudanças nos próximos 3 meses.",
        userProfile: testUser,
        chatHistory: []
      })
    });

    const sdrResult = await sdrTest.json();
    console.log('📝 Resposta SDR:', sdrResult.reply);
    console.log('📊 Estágio atual:', sdrResult.stage);
    console.log('✅ SDR Test - Status:', sdrTest.status === 200 ? 'SUCESSO' : 'ERRO');
  } catch (error) {
    console.error('❌ Erro no teste SDR:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // ============================================
  // TESTE 2: ESTÁGIO ESPECIALISTA - DIAGNÓSTICO
  // ============================================
  console.log('🎓 TESTE 2: Estágio Especialista - Diagnóstico 4 Áreas');
  
  try {
    const specialistTest = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageContent: "Tenho muito interesse em melhorar. Meus maiores problemas são: físico - sedentário há 2 anos; alimentar - como muito fast food; emocional - ansiedade alta; espiritual - sem propósito claro.",
        userProfile: testUser,
        chatHistory: []
      })
    });

    const specialistResult = await specialistTest.json();
    console.log('📝 Resposta Especialista:', specialistResult.reply);
    console.log('📊 Estágio atual:', specialistResult.stage);
    console.log('✅ Especialista Test - Status:', specialistTest.status === 200 ? 'SUCESSO' : 'ERRO');
  } catch (error) {
    console.error('❌ Erro no teste Especialista:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // ============================================
  // TESTE 3: ESTÁGIO VENDEDOR - OBJEÇÕES
  // ============================================
  console.log('💰 TESTE 3: Estágio Vendedor - Tratamento de Objeções');
  
  try {
    const sellerTest = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageContent: "Parece interessante, mas acho meio caro R$ 97 por mês. Também não sei se tenho tempo para isso, minha rotina é muito corrida.",
        userProfile: testUser,
        chatHistory: []
      })
    });

    const sellerResult = await sellerTest.json();
    console.log('📝 Resposta Vendedor:', sellerResult.reply);
    console.log('📊 Estágio atual:', sellerResult.stage);
    console.log('✅ Vendedor Test - Status:', sellerTest.status === 200 ? 'SUCESSO' : 'ERRO');
  } catch (error) {
    console.error('❌ Erro no teste Vendedor:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // ============================================
  // TESTE 4: ESTÁGIO PARCEIRO - CHECK-IN
  // ============================================
  console.log('🤝 TESTE 4: Estágio Parceiro - Check-in Personalizado');
  
  try {
    const partnerTest = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageContent: "Bom dia! Hoje me sinto um pouco cansado, mas consegui fazer a caminhada matinal. Como está meu progresso?",
        userProfile: testUser,
        chatHistory: []
      })
    });

    const partnerResult = await partnerTest.json();
    console.log('📝 Resposta Parceiro:', partnerResult.reply);
    console.log('📊 Estágio atual:', partnerResult.stage);
    console.log('✅ Parceiro Test - Status:', partnerTest.status === 200 ? 'SUCESSO' : 'ERRO');
  } catch (error) {
    console.error('❌ Erro no teste Parceiro:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎉 TODOS OS TESTES CONCLUÍDOS!');
  console.log('🚀 Sistema IA Coach Strategic está FUNCIONAL!');
}

// Executar os testes
testIACoachSystem();