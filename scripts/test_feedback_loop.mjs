#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE não configuradas');
  console.log('Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFeedbackLoop() {
  console.log('\n🧪 TESTE DO LOOP DE FEEDBACK → IA\n');
  console.log('================================\n');

  try {
    // 1. Buscar um usuário de teste
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .limit(1)
      .single();

    if (userError || !users) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    const testUserId = users.id;
    console.log(`✅ Usuário de teste: ${users.full_name} (${users.email})`);

    // 2. Criar um feedback de teste
    const { data: feedback, error: feedbackError } = await supabase
      .from('plan_feedback')
      .insert({
        user_id: testUserId,
        plan_type: 'physical',
        feedback_text: 'TESTE AUTOMATIZADO: Gostaria de treinos mais curtos, com duração máxima de 45 minutos por sessão. Também preciso evitar exercícios que sobrecarreguem o joelho direito.',
        status: 'pending'
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('❌ Erro ao criar feedback:', feedbackError);
      return;
    }

    console.log(`\n✅ Feedback criado: ID ${feedback.id}`);
    console.log(`   Texto: "${feedback.feedback_text.substring(0, 80)}..."`);

    // 3. Simular chamada à Edge Function generate-plan
    console.log('\n🔄 Chamando Edge Function generate-plan...');
    
    const generatePlanUrl = `${supabaseUrl}/functions/v1/generate-plan`;
    
    const response = await fetch(generatePlanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        userId: testUserId,
        planType: 'physical',
        userProfile: {
          limitations: 'joelho direito sensível',
          time: '45 minutos máximo'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro na Edge Function:', errorData);
      return;
    }

    const result = await response.json();
    console.log(`\n✅ Plano gerado com sucesso!`);
    console.log(`   Plan ID: ${result.plan.id}`);
    console.log(`   Feedbacks processados: ${result.feedbacks_processed}`);

    // 4. Verificar se o feedback foi marcado como processado
    const { data: updatedFeedback, error: checkError } = await supabase
      .from('plan_feedback')
      .select('*')
      .eq('id', feedback.id)
      .single();

    if (checkError) {
      console.error('❌ Erro ao verificar feedback:', checkError);
      return;
    }

    console.log(`\n📊 Status do Feedback após regeneração:`);
    console.log(`   Status: ${updatedFeedback.status}`);
    console.log(`   Processado em: ${updatedFeedback.processed_at || 'não processado'}`);
    console.log(`   Plano atualizado: ${updatedFeedback.plan_updated ? 'Sim ✅' : 'Não ❌'}`);
    console.log(`   Resposta IA: ${updatedFeedback.ai_response || 'nenhuma'}`);

    // 5. Validação final
    if (updatedFeedback.status === 'processed' && updatedFeedback.plan_updated) {
      console.log('\n✅ TESTE PASSOU! Loop de feedback funcionando corretamente.\n');
    } else {
      console.log('\n❌ TESTE FALHOU! Feedback não foi processado corretamente.\n');
    }

    // 6. Limpeza (opcional - comentado para análise manual)
    // await supabase.from('plan_feedback').delete().eq('id', feedback.id);
    // await supabase.from('user_training_plans').delete().eq('id', result.plan.id);

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testFeedbackLoop();
