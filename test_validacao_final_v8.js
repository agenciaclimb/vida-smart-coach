// ============================================
// 🎉 TESTE COMPLETO IA COACH v8 - VALIDAÇÃO FINAL
// ============================================

console.log('🎉 VALIDAÇÃO FINAL - IA COACH v8 OTIMIZADO');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('════════════════════════════════════════════════');

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

// ============================================
// 🎯 TESTE 1: ESTÁGIO SDR - PROMPTS CONCISOS
// ============================================

async function testSDRStage() {
  console.log('\n🎯 TESTE 1: ESTÁGIO SDR - PROMPTS CONCISOS');
  console.log('────────────────────────────────────────────────');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        messageContent: "Tenho problemas de saúde e preciso de ajuda",
        userProfile: { 
          id: 'test-sdr-123', 
          full_name: 'João Teste'
        },
        chatHistory: []
      })
    });

    if (response.ok) {
      const data = await response.json();
      const questionCount = (data.reply.match(/\?/g) || []).length;
      
      console.log('✅ Status:', response.status);
      console.log('💬 Resposta SDR:', data.reply);
      console.log('🎯 Estágio:', data.stage);
      console.log('❓ Perguntas:', questionCount);
      console.log('📏 Tamanho:', data.reply.length, 'caracteres');
      console.log('✅ Otimização v8:', questionCount <= 1 && data.reply.length < 200 ? 'SUCESSO!' : 'FALHOU');
      
      return { success: true, concise: questionCount <= 1 && data.reply.length < 200 };
    } else {
      console.log('❌ Erro SDR:', await response.text());
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro SDR:', error.message);
    return { success: false };
  }
}

// ============================================
// 🔄 TESTE 2: CONTEXTO CONVERSACIONAL
// ============================================

async function testConversationalContext() {
  console.log('\n🔄 TESTE 2: CONTEXTO CONVERSACIONAL');
  console.log('────────────────────────────────────────────────');
  
  try {
    // Simular histórico de conversa (como WhatsApp enviaria)
    const chatHistory = [
      { role: 'user', content: 'Oi, preciso de ajuda', created_at: new Date().toISOString() },
      { role: 'assistant', content: 'Oi! Qual seu maior desafio hoje?', created_at: new Date().toISOString() }
    ];

    const response = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        messageContent: "Com alimentação, como muito fast food",
        userProfile: { 
          id: 'test-context-123', 
          full_name: 'Maria Teste'
        },
        chatHistory: chatHistory
      })
    });

    if (response.ok) {
      const data = await response.json();
      const questionCount = (data.reply.match(/\?/g) || []).length;
      const contextual = data.reply.toLowerCase().includes('alimentação') || 
                        data.reply.toLowerCase().includes('fast food') ||
                        data.reply.toLowerCase().includes('comida');
      
      console.log('✅ Status:', response.status);
      console.log('💬 Resposta Contextual:', data.reply);
      console.log('❓ Perguntas:', questionCount);
      console.log('🧠 Mantém Contexto:', contextual ? 'SIM' : 'NÃO');
      console.log('✅ Contexto + Conciso:', contextual && questionCount <= 1 ? 'SUCESSO!' : 'FALHOU');
      
      return { success: true, contextual: contextual && questionCount <= 1 };
    } else {
      console.log('❌ Erro Contexto:', await response.text());
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro Contexto:', error.message);
    return { success: false };
  }
}

// ============================================
// 🚀 TESTE 3: ESTÁGIO ESPECIALISTA
// ============================================

async function testSpecialistStage() {
  console.log('\n🚀 TESTE 3: ESTÁGIO ESPECIALISTA - UMA ÁREA POR VEZ');
  console.log('────────────────────────────────────────────────');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        messageContent: "Tenho interesse em melhorar minha vida",
        userProfile: { 
          id: 'test-specialist-123', 
          full_name: 'Pedro Teste'
        },
        chatHistory: [
          { role: 'user', content: 'Preciso de ajuda', created_at: new Date().toISOString() },
          { role: 'assistant', content: 'Qual seu maior desafio?', created_at: new Date().toISOString() },
          { role: 'user', content: 'Minha saúde física e emocional', created_at: new Date().toISOString() },
          { role: 'assistant', content: 'Como isso afeta seu dia?', created_at: new Date().toISOString() },
          { role: 'user', content: 'Me sinto cansado e ansioso sempre', created_at: new Date().toISOString() }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const questionCount = (data.reply.match(/\?/g) || []).length;
      const focusedArea = data.reply.toLowerCase().includes('física') || 
                         data.reply.toLowerCase().includes('emocional') ||
                         data.reply.toLowerCase().includes('alimentação') ||
                         data.reply.toLowerCase().includes('espiritual');
      
      console.log('✅ Status:', response.status);
      console.log('💬 Resposta Especialista:', data.reply);
      console.log('🎯 Estágio:', data.stage);
      console.log('❓ Perguntas:', questionCount);
      console.log('🔍 Foca em Uma Área:', focusedArea ? 'SIM' : 'NÃO');
      console.log('✅ Especialista v8:', focusedArea && questionCount <= 1 ? 'SUCESSO!' : 'FALHOU');
      
      return { success: true, focused: focusedArea && questionCount <= 1 };
    } else {
      console.log('❌ Erro Especialista:', await response.text());
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro Especialista:', error.message);
    return { success: false };
  }
}

// ============================================
// 📊 EXECUTAR TODOS OS TESTES
// ============================================

async function runCompleteValidation() {
  console.log('🧪 INICIANDO VALIDAÇÃO COMPLETA v8');
  
  const sdrResult = await testSDRStage();
  const contextResult = await testConversationalContext();
  const specialistResult = await testSpecialistStage();
  
  console.log('\n🏆 RESULTADO FINAL - IA COACH v8');
  console.log('════════════════════════════════════════════════');
  
  const allPassed = sdrResult.success && contextResult.success && specialistResult.success;
  const optimized = sdrResult.concise && contextResult.contextual && specialistResult.focused;
  
  console.log('📋 RESUMO DOS TESTES:');
  console.log(`1. ✅ SDR Conciso: ${sdrResult.concise ? 'PASSOU' : 'FALHOU'}`);
  console.log(`2. ✅ Contexto WhatsApp: ${contextResult.contextual ? 'PASSOU' : 'FALHOU'}`);
  console.log(`3. ✅ Especialista Focado: ${specialistResult.focused ? 'PASSOU' : 'FALHOU'}`);
  
  console.log('\n🎯 OBJETIVOS v8:');
  console.log(`✅ Uma pergunta por vez: ${optimized ? 'ALCANÇADO' : 'PENDENTE'}`);
  console.log(`✅ Contexto WhatsApp: ${contextResult.contextual ? 'ALCANÇADO' : 'PENDENTE'}`);
  console.log(`✅ Experiência unificada: ${allPassed ? 'ALCANÇADO' : 'PENDENTE'}`);
  
  if (allPassed && optimized) {
    console.log('\n🎉 PARABÉNS! OTIMIZAÇÕES v8 100% FUNCIONANDO!');
    console.log('🚀 Sistema pronto para produção com UX otimizada!');
    console.log('✅ Usuário agora terá experiência fluida e natural!');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verificar implementação.');
  }
  
  console.log('\n📚 DOCUMENTAÇÃO ATUALIZADA:');
  console.log('- OTIMIZACAO_IA_COACH_V8.md');
  console.log('- documento_mestre_vida_smart_coach_final.md');
  console.log('- Todo list: Todas as tarefas concluídas! ✅');
}

runCompleteValidation();