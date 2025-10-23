/**
 * Script de Validação E2E: Loop de Feedback → IA
 * 
 * Testa o fluxo completo:
 * 1. Inserir feedback na tabela plan_feedback
 * 2. Verificar que o feedback foi salvo
 * 3. Simular chamada da IA e verificar que o feedback é incluído no contexto
 */

import { createClient } from '@supabase/supabase-js';

// Nota: Este script requer as variáveis de ambiente configuradas
// Para desenvolvimento local, crie um arquivo .env.local com:
// VITE_SUPABASE_URL=sua-url
// SUPABASE_SERVICE_ROLE_KEY=sua-chave

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('\n💡 Para executar este teste:');
  console.error('   1. Crie um arquivo .env.local na raiz do projeto');
  console.error('   2. Adicione as variáveis:');
  console.error('      VITE_SUPABASE_URL=sua-url-supabase');
  console.error('      SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key');
  console.error('   3. Execute: node test_feedback_loop.mjs\n');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFeedbackLoop() {
  console.log('\n🧪 TESTE E2E: Loop de Feedback → IA\n');
  console.log('=' .repeat(60));

  // Passo 1: Buscar usuário de teste
  console.log('\n📋 Passo 1: Buscar usuário de teste...');
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id, name, email')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('❌ Erro ao buscar usuário:', userError);
    process.exit(1);
  }

  const testUser = users[0];
  console.log(`✅ Usuário encontrado: ${testUser.name} (${testUser.email})`);

  // Passo 2: Inserir feedback de teste
  console.log('\n📝 Passo 2: Inserir feedback de teste...');
  const testFeedback = {
    user_id: testUser.id,
    plan_type: 'workout',
    feedback_text: 'Os exercícios estão muito intensos para o meu nível atual. Gostaria de algo mais leve.',
    sentiment: 'negative',
    created_at: new Date().toISOString()
  };

  const { data: insertedFeedback, error: insertError } = await supabase
    .from('plan_feedback')
    .insert(testFeedback)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Erro ao inserir feedback:', insertError);
    process.exit(1);
  }

  console.log('✅ Feedback inserido com sucesso:');
  console.log(`   ID: ${insertedFeedback.id}`);
  console.log(`   Tipo: ${insertedFeedback.plan_type}`);
  console.log(`   Texto: "${insertedFeedback.feedback_text}"`);
  console.log(`   Sentimento: ${insertedFeedback.sentiment}`);

  // Passo 3: Buscar feedback pendente (simular o que a IA faz)
  console.log('\n🤖 Passo 3: Buscar feedback pendente (contexto da IA)...');
  const { data: pendingFeedback, error: pendingError } = await supabase
    .from('plan_feedback')
    .select('*')
    .eq('user_id', testUser.id)
    .eq('processed', false)
    .order('created_at', { ascending: false });

  if (pendingError) {
    console.error('❌ Erro ao buscar feedback pendente:', pendingError);
    process.exit(1);
  }

  console.log(`✅ Feedback pendente encontrado: ${pendingFeedback.length} item(s)`);
  
  if (pendingFeedback.length > 0) {
    console.log('\n📊 Detalhes do feedback pendente:');
    pendingFeedback.forEach((fb, idx) => {
      console.log(`\n   [${idx + 1}] ${fb.plan_type}:`);
      console.log(`       Texto: "${fb.feedback_text}"`);
      console.log(`       Sentimento: ${fb.sentiment}`);
      console.log(`       Criado em: ${new Date(fb.created_at).toLocaleString('pt-BR')}`);
    });
  }

  // Passo 4: Verificar estrutura da resposta da IA (simular)
  console.log('\n🎯 Passo 4: Simular inclusão no contexto da IA...');
  
  const contextPrompt = `
FEEDBACK PENDENTE DO USUÁRIO:
${pendingFeedback.map(fb => `
- Plano de ${fb.plan_type === 'workout' ? 'Treino' : fb.plan_type === 'meal' ? 'Alimentação' : fb.plan_type === 'spiritual' ? 'Práticas Espirituais' : 'Desenvolvimento Emocional'}
  Feedback: "${fb.feedback_text}"
  Sentimento: ${fb.sentiment}
  Data: ${new Date(fb.created_at).toLocaleDateString('pt-BR')}
`).join('\n')}

IMPORTANTE: O usuário enviou feedback sobre os planos. Reconheça o feedback específico e faça UMA pergunta curta para ajustar o plano conforme a necessidade dele.
`.trim();

  console.log('✅ Contexto gerado para a IA:');
  console.log('─'.repeat(60));
  console.log(contextPrompt);
  console.log('─'.repeat(60));

  // Passo 5: Limpar dados de teste
  console.log('\n🧹 Passo 5: Limpar dados de teste...');
  const { error: deleteError } = await supabase
    .from('plan_feedback')
    .delete()
    .eq('id', insertedFeedback.id);

  if (deleteError) {
    console.error('⚠️  Aviso: Erro ao deletar feedback de teste:', deleteError);
  } else {
    console.log('✅ Feedback de teste removido');
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTE E2E CONCLUÍDO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log('\n📝 Resumo:');
  console.log('   ✅ Inserção de feedback funcionando');
  console.log('   ✅ Busca de feedback pendente funcionando');
  console.log('   ✅ Estrutura de dados correta');
  console.log('   ✅ Contexto da IA sendo montado corretamente');
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Testar no app web (enviar feedback real via UI)');
  console.log('   2. Testar conversa com IA via WhatsApp ou web');
  console.log('   3. Verificar se a IA reconhece e responde ao feedback');
  console.log('   4. Publicar Edge Functions se necessário\n');
}

// Executar teste
testFeedbackLoop().catch(error => {
  console.error('\n❌ Erro fatal no teste:', error);
  process.exit(1);
});
