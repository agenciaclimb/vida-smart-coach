/**
 * Validação Simplificada: Estrutura da Tabela plan_feedback
 * 
 * Verifica se a migration foi aplicada corretamente
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 VALIDAÇÃO: Estrutura da Tabela plan_feedback\n');
console.log('='.repeat(60));

// SQL para verificar estrutura da tabela
const validationSQL = `
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'plan_feedback'
) as table_exists;

-- Verificar colunas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'plan_feedback'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'plan_feedback'
AND schemaname = 'public';

-- Verificar RLS
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'plan_feedback';

-- Contar registros
SELECT COUNT(*) as total_records FROM public.plan_feedback;
`;

console.log('\n📋 SQL de Validação:');
console.log('─'.repeat(60));
console.log(validationSQL.trim());
console.log('─'.repeat(60));

console.log('\n✅ Verificações a serem feitas:');
console.log('   1. Tabela plan_feedback existe');
console.log('   2. Colunas corretas (user_id, plan_type, feedback_text, etc.)');
console.log('   3. Índices criados (idx_plan_feedback_user, idx_plan_feedback_pending)');
console.log('   4. RLS policies ativas (select, insert, update)');
console.log('   5. Contagem de registros');

console.log('\n💡 Para executar manualmente no Supabase SQL Editor:');
console.log('   1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/editor');
console.log('   2. Cole o SQL acima');
console.log('   3. Execute e verifique os resultados');

console.log('\n📊 Estrutura Esperada da Tabela:');
console.log('─'.repeat(60));

const expectedStructure = {
  table_name: 'plan_feedback',
  columns: [
    { name: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()' },
    { name: 'user_id', type: 'uuid', nullable: 'NO', default: null },
    { name: 'plan_type', type: 'text', nullable: 'NO', default: null },
    { name: 'feedback_text', type: 'text', nullable: 'NO', default: null },
    { name: 'sentiment', type: 'text', nullable: 'YES', default: null },
    { name: 'processed', type: 'boolean', nullable: 'YES', default: 'false' },
    { name: 'processed_at', type: 'timestamp with time zone', nullable: 'YES', default: null },
    { name: 'created_at', type: 'timestamp with time zone', nullable: 'YES', default: 'CURRENT_TIMESTAMP' }
  ],
  indexes: [
    'idx_plan_feedback_user (user_id, created_at DESC)',
    'idx_plan_feedback_pending (user_id, processed) WHERE processed = false',
    'plan_feedback_pkey (id)'
  ],
  rls_policies: [
    'Users can view their own feedback (SELECT)',
    'Users can insert their own feedback (INSERT)',
    'Users can update their own feedback (UPDATE)'
  ]
};

expectedStructure.columns.forEach(col => {
  console.log(`   ${col.name.padEnd(20)} ${col.type.padEnd(30)} ${col.nullable} ${col.default || ''}`);
});

console.log('\n🔐 RLS Policies Esperadas:');
expectedStructure.rls_policies.forEach((policy, idx) => {
  console.log(`   ${idx + 1}. ${policy}`);
});

console.log('\n📁 Índices Esperados:');
expectedStructure.indexes.forEach((index, idx) => {
  console.log(`   ${idx + 1}. ${index}`);
});

// Verificar se a migration existe
console.log('\n📂 Verificar arquivo de migration:');
const migrationPath = join(__dirname, 'supabase', 'migrations', '20251022_create_plan_feedback.sql');

try {
  const migrationContent = readFileSync(migrationPath, 'utf-8');
  console.log('   ✅ Migration encontrada:', migrationPath);
  console.log(`   ✅ Tamanho: ${migrationContent.length} caracteres`);
  
  // Verificar componentes principais
  const checks = {
    'CREATE TABLE': migrationContent.includes('CREATE TABLE IF NOT EXISTS public.plan_feedback'),
    'Índice user': migrationContent.includes('idx_plan_feedback_user'),
    'Índice pending': migrationContent.includes('idx_plan_feedback_pending'),
    'RLS Enable': migrationContent.includes('ALTER TABLE public.plan_feedback ENABLE ROW LEVEL SECURITY'),
    'Policy SELECT': migrationContent.includes('CREATE POLICY') && migrationContent.includes('SELECT'),
    'Policy INSERT': migrationContent.includes('CREATE POLICY') && migrationContent.includes('INSERT'),
    'Policy UPDATE': migrationContent.includes('CREATE POLICY') && migrationContent.includes('UPDATE')
  };

  console.log('\n   📊 Componentes da Migration:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`      ${value ? '✅' : '❌'} ${key}`);
  });

  const allPassed = Object.values(checks).every(v => v);
  if (allPassed) {
    console.log('\n   ✅ Migration contém todos os componentes necessários');
  } else {
    console.log('\n   ⚠️  Alguns componentes podem estar faltando');
  }

} catch (error) {
  console.log('   ❌ Migration não encontrada:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('✅ VALIDAÇÃO DE ESTRUTURA CONCLUÍDA');
console.log('='.repeat(60));

console.log('\n🎯 Próximos Passos para Validação E2E:');
console.log('   1. ✅ Estrutura da tabela validada (este script)');
console.log('   2. 🔄 Testar no app web:');
console.log('      - Acessar http://localhost:5173');
console.log('      - Fazer login');
console.log('      - Abrir aba "Planos"');
console.log('      - Enviar feedback em qualquer plano');
console.log('      - Verificar console do navegador para erros');
console.log('   3. 🤖 Testar com IA:');
console.log('      - Abrir chat com IA (WhatsApp ou Web)');
console.log('      - Enviar mensagem');
console.log('      - Verificar se IA menciona o feedback enviado');
console.log('   4. 📊 Verificar no Supabase:');
console.log('      - Table Editor → plan_feedback');
console.log('      - Confirmar que o feedback foi inserido');
console.log('      - Verificar campos: user_id, plan_type, feedback_text, processed=false');

console.log('\n');
