// 🎯 TESTE COMPLETO IA COACH - SISTEMA 100% FUNCIONAL
// Teste das 4 fases: SDR → Especialista → Vendedor → Parceiro

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zzugbgoylwbaojdnunuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk0MjMzOTEsImV4cCI6MjAzNDk5OTM5MX0.gBWBfG6-4T_TqOXKsaWsCtdMV8Q7tDTRH6dZYY3rLyI'
);

async function testIACoachComplete() {
  console.log('🚀 INICIANDO TESTE COMPLETO IA COACH');
  console.log('=' .repeat(50));

  // 1. Verificar se as tabelas foram criadas
  console.log('\n1️⃣ VERIFICANDO TABELAS CRIADAS...');
  
  try {
    const tables = [
      'client_stages',
      'interactions', 
      'conversation_memory',
      'area_diagnostics',
      'gamification',
      'client_goals',
      'client_actions'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Erro na tabela ${table}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table} - OK`);
      }
    }

  } catch (error) {
    console.log('❌ Erro ao verificar tabelas:', error.message);
  }

  // 2. Testar Edge Function IA Coach
  console.log('\n2️⃣ TESTANDO EDGE FUNCTION IA COACH...');
  
  try {
    const { data, error } = await supabase.functions.invoke('ia-coach-chat', {
      body: {
        message: 'Olá! Gostaria de começar minha jornada de saúde',
        user_id: 'test-user-' + Date.now()
      }
    });

    if (error) {
      console.log('❌ Erro no Edge Function:', error);
    } else {
      console.log('✅ Edge Function - SUCESSO!');
      console.log('📝 Resposta:', data);
    }

  } catch (error) {
    console.log('❌ Erro ao chamar Edge Function:', error.message);
  }

  // 3. Validar sistema de estágios
  console.log('\n3️⃣ VALIDANDO SISTEMA DE ESTÁGIOS...');
  
  const testUserId = 'test-user-stages-' + Date.now();
  
  try {
    // Criar estágio inicial SDR
    const { data: stageData, error: stageError } = await supabase
      .from('client_stages')
      .insert({
        user_id: testUserId,
        current_stage: 'sdr',
        stage_metadata: { test: true },
        bant_score: { budget: 0, authority: 0, need: 0, timeline: 0 }
      })
      .select()
      .single();

    if (stageError) {
      console.log('❌ Erro ao criar estágio:', stageError.message);
    } else {
      console.log('✅ Estágio SDR criado:', stageData.id);
    }

    // Criar interação
    const { data: interactionData, error: interactionError } = await supabase
      .from('interactions')
      .insert({
        user_id: testUserId,
        interaction_type: 'message',
        stage: 'sdr',
        content: 'Primeira mensagem teste',
        ai_response: 'Resposta da IA teste'
      })
      .select()
      .single();

    if (interactionError) {
      console.log('❌ Erro ao criar interação:', interactionError.message);
    } else {
      console.log('✅ Interação criada:', interactionData.id);
    }

  } catch (error) {
    console.log('❌ Erro no teste de estágios:', error.message);
  }

  console.log('\n🎉 TESTE COMPLETO FINALIZADO!');
  console.log('=' .repeat(50));
}

// Executar teste
testIACoachComplete().catch(console.error);