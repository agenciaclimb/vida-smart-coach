// ============================================
// 🚨 DEBUG URGENTE - IA WHATSAPP PAROU
// ============================================

console.log('🚨 DEBUG URGENTE - IA WHATSAPP NÃO RESPONDE');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('════════════════════════════════════════════════');

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

// ============================================
// 🔍 TESTE 1: IA COACH FUNCIONANDO?
// ============================================

async function testIACoachDirect() {
  console.log('\n🔍 TESTE 1: IA COACH DIRETA');
  console.log('────────────────────────────────────────────────');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        messageContent: "Oi, como está?",
        userProfile: { 
          id: 'test-whatsapp-debug', 
          full_name: 'Debug User'
        },
        chatHistory: []
      })
    });

    console.log('📊 Status IA Coach:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ IA Coach FUNCIONANDO:', data.reply);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ IA Coach FALHANDO:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ IA Coach ERRO:', error.message);
    return false;
  }
}

// ============================================
// 📱 TESTE 2: WEBHOOK EVOLUTION FUNCIONANDO?
// ============================================

async function testEvolutionWebhook() {
  console.log('\n📱 TESTE 2: WEBHOOK EVOLUTION');
  console.log('────────────────────────────────────────────────');
  
  try {
    // Teste básico de conectividade
    const response = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: "test-debug",
        data: null
      })
    });

    console.log('📊 Status Webhook:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Webhook PROTEGIDO (correto)');
      return true;
    } else {
      const text = await response.text();
      console.log('⚠️ Webhook resposta:', text);
      return response.ok;
    }
  } catch (error) {
    console.log('❌ Webhook ERRO:', error.message);
    return false;
  }
}

// ============================================
// 🔧 TESTE 3: SIMULAÇÃO COMPLETA WHATSAPP
// ============================================

async function simulateWhatsAppFlow() {
  console.log('\n🔧 TESTE 3: SIMULAÇÃO WHATSAPP COMPLETA');
  console.log('────────────────────────────────────────────────');
  
  try {
    // Simular payload real do WhatsApp
    const webhookPayload = {
      event: "messages.upsert",
      instance: "vida-smart-coach",
      data: {
        key: {
          remoteJid: "5516981459950@s.whatsapp.net",
          fromMe: false
        },
        message: {
          conversation: "Oi, preciso de ajuda urgente"
        }
      }
    };

    console.log('📤 Enviando payload simulado...');
    console.log('📱 Telefone:', webhookPayload.data.key.remoteJid);
    console.log('💬 Mensagem:', webhookPayload.data.message.conversation);

    // PROBLEMA: Não podemos testar sem a EVOLUTION_API_SECRET
    console.log('⚠️ BLOQUEIO: Precisamos da EVOLUTION_API_SECRET para testar');
    console.log('💡 VERIFICAR: Se a secret está configurada corretamente');
    
    return false;
  } catch (error) {
    console.log('❌ Simulação ERRO:', error.message);
    return false;
  }
}

// ============================================
// 🔍 ANÁLISE DOS LOGS SUPABASE
// ============================================

function analyzeLogs() {
  console.log('\n🔍 ANÁLISE DOS LOGS (baseado nas imagens)');
  console.log('────────────────────────────────────────────────');
  
  console.log('📋 OBSERVAÇÕES dos logs:');
  console.log('1. 🔴 Vários erros nas Edge Functions');
  console.log('2. 🔴 "Function.net.http_post(url -> webhook..." erros');
  console.log('3. 🔴 "does not exist" errors');
  console.log('4. 🔴 Row Level Security policy violations');
  
  console.log('\n🎯 POSSÍVEIS CAUSAS:');
  console.log('1. ❌ Evolution API não está enviando webhooks');
  console.log('2. ❌ EVOLUTION_API_SECRET incorreta ou mudou');
  console.log('3. ❌ RLS policies bloqueando inserções');
  console.log('4. ❌ IA Coach function com erro interno');
  console.log('5. ❌ WhatsApp user não encontrado no banco');
}

// ============================================
// 💡 SOLUÇÕES RECOMENDADAS
// ============================================

function recommendSolutions() {
  console.log('\n💡 SOLUÇÕES URGENTES RECOMENDADAS:');
  console.log('════════════════════════════════════════════════');
  
  console.log('🔧 AÇÃO 1: Verificar Evolution API');
  console.log('   - Confirmar se webhook está configurado');
  console.log('   - Verificar se EVOLUTION_API_SECRET está correta');
  console.log('   - Testar conectividade Evolution → Supabase');
  
  console.log('\n🔧 AÇÃO 2: Verificar Edge Functions');
  console.log('   - Checar logs detalhados das funções');
  console.log('   - Confirmar se deploy v8 não quebrou algo');
  console.log('   - Verificar environment variables');
  
  console.log('\n🔧 AÇÃO 3: Verificar Database');
  console.log('   - RLS policies nas tabelas whatsapp_messages');
  console.log('   - Verificar se user existe na tabela user_profiles');
  console.log('   - Confirmar permissões de inserção');
  
  console.log('\n⚡ TESTE RÁPIDO MANUAL:');
  console.log('1. Enviar mensagem WhatsApp');
  console.log('2. Verificar logs Edge Functions em tempo real');
  console.log('3. Checar se mensagem aparece na tabela whatsapp_messages');
  console.log('4. Verificar se IA Coach é chamada corretamente');
}

// Executar diagnóstico
async function runUrgentDiagnosis() {
  const iaWorking = await testIACoachDirect();
  const webhookWorking = await testEvolutionWebhook();
  await simulateWhatsAppFlow();
  
  analyzeLogs();
  recommendSolutions();
  
  console.log('\n🏁 RESUMO DIAGNÓSTICO:');
  console.log('════════════════════════════════════════════════');
  console.log(`📊 IA Coach: ${iaWorking ? '✅ FUNCIONANDO' : '❌ FALHANDO'}`);
  console.log(`📊 Webhook: ${webhookWorking ? '✅ PROTEGIDO' : '❌ PROBLEMA'}`);
  console.log('📊 WhatsApp Flow: ⚠️ NÃO TESTÁVEL (sem secret)');
  
  if (iaWorking && webhookWorking) {
    console.log('\n✅ COMPONENTES BÁSICOS OK');
    console.log('🔍 PROBLEMA: Provavelmente na integração Evolution API');
    console.log('💡 FOCO: Verificar webhook configuration e secrets');
  } else {
    console.log('\n❌ PROBLEMA GRAVE DETECTADO');
    console.log('🚨 URGENTE: Corrigir componentes básicos primeiro');
  }
}

runUrgentDiagnosis();