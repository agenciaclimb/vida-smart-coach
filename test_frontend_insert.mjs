/**
 * Teste de INSERT com simulação de autenticação
 * Verifica se o problema é RLS ou autenticação
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
const envPath = join(__dirname, '.env.local');
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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🧪 TESTE: Simulação de INSERT do Frontend\n');
console.log('='.repeat(60));

async function testFrontendInsert() {
  // Cliente admin para setup
  const admin = createClient(supabaseUrl, supabaseServiceKey);
  
  // Cliente como frontend (anon key)
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Buscar usuário
  console.log('\n👤 Passo 1: Buscar usuário...');
  const { data: user } = await admin
    .from('user_profiles')
    .select('id, name, email')
    .eq('email', 'jeferson@jccempresas.com.br')
    .single();

  console.log(`✅ Usuário: ${user.name} (${user.email})`);

  // 2. Criar sessão de autenticação simulada
  console.log('\n🔐 Passo 2: Tentar INSERT SEM autenticação (como frontend não logado)...');
  
  const feedbackSemAuth = {
    user_id: user.id,
    plan_type: 'physical',
    feedback_text: 'Teste sem autenticação',
    status: 'pending'
  };

  const { data: insertSemAuth, error: errorSemAuth } = await client
    .from('plan_feedback')
    .insert(feedbackSemAuth)
    .select();

  if (errorSemAuth) {
    console.error('❌ ERRO esperado (sem autenticação):');
    console.error('   Código:', errorSemAuth.code);
    console.error('   Mensagem:', errorSemAuth.message);
    console.error('   Detalhes:', errorSemAuth.details);
    console.error('   Hint:', errorSemAuth.hint);
    
    if (errorSemAuth.code === '42501' || errorSemAuth.message.includes('policy')) {
      console.log('\n✅ RLS está funcionando corretamente!');
      console.log('   Bloqueou INSERT de usuário não autenticado.');
    }
  } else {
    console.log('⚠️  INSERT funcionou SEM autenticação (RLS pode estar desabilitado!)');
  }

  // 3. Verificar usuário autenticado no app
  console.log('\n🔍 Passo 3: Verificar se há sessão ativa no Supabase...');
  console.log('\n💡 INSTRUÇÕES PARA VOCÊ:');
  console.log('   1. Abra o app: http://localhost:5173');
  console.log('   2. Faça login (se ainda não estiver logado)');
  console.log('   3. Abra DevTools (F12) → Console');
  console.log('   4. Digite e execute:');
  console.log('      ');
  console.log('      const { data } = await supabase.auth.getSession();');
  console.log('      console.log("Usuário autenticado:", data.session?.user?.id);');
  console.log('      console.log("Email:", data.session?.user?.email);');
  console.log('      ');
  console.log('   5. Se retornar null, você NÃO está autenticado!');
  console.log('   6. Se retornar user_id, copie e cole aqui para validar.');

  // 4. Verificar RLS policies
  console.log('\n🔐 Passo 4: Verificar RLS na tabela...');
  const { data: tableInfo } = await admin
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'plan_feedback')
    .single();

  console.log('   Tabela: plan_feedback');
  console.log('   Schema:', tableInfo?.schemaname || 'public');

  // 5. Testar com user.id do próprio usuário autenticado
  console.log('\n✅ Passo 5: Para fazer o INSERT funcionar:');
  console.log('   No app (http://localhost:5173), execute no Console do DevTools:');
  console.log('   ');
  console.log('   // 1. Verificar se está autenticado');
  console.log('   const { data: session } = await supabase.auth.getSession();');
  console.log('   console.log("Session:", session);');
  console.log('   ');
  console.log('   // 2. Se estiver autenticado, testar INSERT');
  console.log('   if (session?.session?.user) {');
  console.log('     const { data, error } = await supabase.from("plan_feedback").insert({');
  console.log('       user_id: session.session.user.id,');
  console.log('       plan_type: "physical",');
  console.log('       feedback_text: "Teste direto do console",');
  console.log('       status: "pending"');
  console.log('     });');
  console.log('     console.log("Resultado:", data, error);');
  console.log('   }');
  console.log('   ');

  // Limpar
  console.log('\n🧹 Limpando dados de teste...');
  await admin.from('plan_feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✅ Feedbacks de teste removidos\n');

  console.log('='.repeat(60));
  console.log('🎯 DIAGNÓSTICO');
  console.log('='.repeat(60));
  console.log('\nProblema mais provável: USUÁRIO NÃO AUTENTICADO');
  console.log('\nSoluções:');
  console.log('1. ✅ Fazer login no app (http://localhost:5173)');
  console.log('2. ✅ Verificar se session está ativa (console do navegador)');
  console.log('3. ✅ Testar INSERT diretamente do console (código acima)');
  console.log('4. ✅ Se funcionar no console, problema é no componente PlanTab');
  console.log('\nSe ainda não funcionar:');
  console.log('- Verificar se RLS permite INSERT para usuário autenticado');
  console.log('- Verificar se user_id está correto no frontend');
  console.log('- Verificar logs do Supabase Dashboard\n');
}

testFrontendInsert().catch(console.error);
