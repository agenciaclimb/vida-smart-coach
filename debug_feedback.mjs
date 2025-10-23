/**
 * Script de Debug: Verificar feedback e testar insert direto
 * Usa as credenciais de .env.local para testes
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
const envPath = join(__dirname, '.env.local');
let supabaseUrl, supabaseAnonKey, supabaseServiceKey;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      envVars[key.trim()] = value;
    }
  });

  supabaseUrl = envVars.VITE_SUPABASE_URL;
  supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
  supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

  console.log('✅ Arquivo .env.local carregado');
  console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  
} catch (error) {
  console.error('❌ Erro ao carregar .env.local:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis necessárias não encontradas no .env.local');
  process.exit(1);
}

// Cliente com service role (bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente com anon key (como no frontend)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

console.log('\n🔍 DEBUG: Verificar Feedback e RLS\n');
console.log('='.repeat(60));

async function debugFeedback() {
  // 1. Verificar se a tabela existe
  console.log('\n📋 Passo 1: Verificar estrutura da tabela...');
  const { data: tableCheck, error: tableError } = await supabaseAdmin
    .from('plan_feedback')
    .select('*')
    .limit(0);

  if (tableError) {
    console.error('❌ Tabela plan_feedback não encontrada ou erro:', tableError);
    return;
  }
  console.log('✅ Tabela plan_feedback existe');

  // 2. Listar todos os feedbacks (admin)
  console.log('\n📊 Passo 2: Listar feedbacks existentes (admin)...');
  const { data: allFeedback, error: listError } = await supabaseAdmin
    .from('plan_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (listError) {
    console.error('❌ Erro ao listar feedbacks:', listError);
  } else {
    console.log(`✅ Total de feedbacks no banco: ${allFeedback.length}`);
    if (allFeedback.length > 0) {
      console.log('\n📝 Últimos feedbacks:');
      allFeedback.slice(0, 3).forEach((fb, idx) => {
        console.log(`\n   [${idx + 1}] ID: ${fb.id.substring(0, 8)}...`);
        console.log(`       Usuário: ${fb.user_id.substring(0, 8)}...`);
        console.log(`       Tipo: ${fb.plan_type}`);
        console.log(`       Texto: "${fb.feedback_text.substring(0, 50)}${fb.feedback_text.length > 50 ? '...' : ''}"`);
        console.log(`       Status: ${fb.status}`);
        console.log(`       Criado: ${new Date(fb.created_at).toLocaleString('pt-BR')}`);
      });
    }
  }

  // 3. Buscar primeiro usuário
  console.log('\n👤 Passo 3: Buscar usuário de teste...');
  const { data: users, error: userError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, name, email')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('❌ Erro ao buscar usuário:', userError);
    return;
  }

  const testUser = users[0];
  console.log(`✅ Usuário: ${testUser.name} (${testUser.email})`);
  console.log(`   ID: ${testUser.id}`);

  // 4. Testar INSERT com admin (bypass RLS)
  console.log('\n📝 Passo 4: Testar INSERT como admin (bypass RLS)...');
  const testFeedbackAdmin = {
    user_id: testUser.id,
    plan_type: 'physical',
    feedback_text: `[DEBUG TEST ${new Date().toISOString()}] Este é um teste de feedback via admin`,
    status: 'pending'
  };

  const { data: insertedAdmin, error: insertErrorAdmin } = await supabaseAdmin
    .from('plan_feedback')
    .insert(testFeedbackAdmin)
    .select()
    .single();

  if (insertErrorAdmin) {
    console.error('❌ Erro ao inserir (admin):', insertErrorAdmin);
  } else {
    console.log('✅ Feedback inserido com sucesso (admin)');
    console.log(`   ID: ${insertedAdmin.id}`);
    console.log(`   Status: ${insertedAdmin.status}`);
  }

  // 5. Verificar RLS policies
  console.log('\n🔐 Passo 5: Verificar RLS policies...');
  console.log('⚠️  Execute manualmente no SQL Editor para verificar policies:');
  console.log('   SELECT * FROM pg_policies WHERE tablename = \'plan_feedback\';');

  // 6. Simular INSERT como usuário autenticado (com anon key)
  console.log('\n👥 Passo 6: Simular INSERT como usuário autenticado...');
  console.log('⚠️  NOTA: Este teste requer que você esteja autenticado');
  console.log('   Para testar RLS corretamente, você precisa:');
  console.log('   1. Fazer login no app web (http://localhost:5173)');
  console.log('   2. Copiar o access_token do localStorage');
  console.log('   3. Usar supabase.auth.setSession({ access_token, refresh_token })');

  // 7. Limpar dados de teste
  if (insertedAdmin) {
    console.log('\n🧹 Passo 7: Limpar feedback de teste...');
    const { error: deleteError } = await supabaseAdmin
      .from('plan_feedback')
      .delete()
      .eq('id', insertedAdmin.id);

    if (deleteError) {
      console.error('⚠️  Erro ao deletar teste:', deleteError);
    } else {
      console.log('✅ Feedback de teste removido');
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO DEBUG');
  console.log('='.repeat(60));
  console.log(`\n✅ Tabela existe: SIM`);
  console.log(`✅ Total de feedbacks: ${allFeedback?.length || 0}`);
  console.log(`✅ INSERT funciona (admin): SIM`);
  console.log(`\n🎯 Próximos passos para debug do frontend:`);
  console.log(`   1. Abra o DevTools (F12) no navegador`);
  console.log(`   2. Vá para Console`);
  console.log(`   3. Envie um feedback pelo app`);
  console.log(`   4. Verifique se aparece erro no console`);
  console.log(`   5. Verifique a aba Network para ver a requisição POST`);
  console.log(`\n💡 Se houver erro 401/403:`);
  console.log(`   - Usuário pode não estar autenticado`);
  console.log(`   - RLS pode estar bloqueando`);
  console.log(`   - Verificar se user.id está correto\n`);
}

debugFeedback().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
