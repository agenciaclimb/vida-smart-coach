-- 🎯 TESTE SIMPLES IA COACH - SEM DEPENDÊNCIAS AUTH
-- Execute no SQL Editor: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new

-- 1. ✅ VERIFICAR SE TODAS AS TABELAS FORAM CRIADAS
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'client_stages',
    'interactions', 
    'conversation_memory',
    'area_diagnostics',
    'gamification',
    'client_goals',
    'client_actions'
  )
ORDER BY table_name;

-- 2. ✅ VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  CASE WHEN c.column_default LIKE '%gen_random_uuid%' THEN 'UUID AUTO' 
       WHEN c.column_default LIKE '%NOW()%' THEN 'TIMESTAMP AUTO'
       ELSE c.column_default END as column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('client_stages', 'interactions', 'conversation_memory')
ORDER BY t.table_name, c.ordinal_position;

-- 3. ✅ VERIFICAR ÍNDICES CRIADOS
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'client_stages',
    'interactions', 
    'conversation_memory',
    'area_diagnostics',
    'gamification',
    'client_goals',
    'client_actions'
  )
ORDER BY tablename, indexname;

-- 4. ✅ VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'client_stages',
    'interactions', 
    'conversation_memory',
    'area_diagnostics',
    'gamification',
    'client_goals',
    'client_actions'
  )
ORDER BY tablename, policyname;

-- 5. ✅ VERIFICAR TRIGGERS CRIADOS
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  trigger_schema,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'client_stages',
    'area_diagnostics',
    'client_goals',
    'client_actions'
  )
ORDER BY event_object_table, trigger_name;

-- 6. ✅ VERIFICAR CONSTRAINTS E FOREIGN KEYS
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'client_stages',
    'interactions', 
    'conversation_memory',
    'area_diagnostics',
    'gamification',
    'client_goals',
    'client_actions'
  )
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 7. ✅ TESTAR INSERÇÃO SEM FOREIGN KEY (UUID manual)
-- Gerar UUID fictício para teste
WITH test_uuid AS (
  SELECT gen_random_uuid() as fake_user_id
)
INSERT INTO client_stages (
  id,
  user_id, 
  current_stage, 
  stage_metadata, 
  bant_score
) 
SELECT 
  gen_random_uuid(),
  fake_user_id,
  'sdr', 
  '{"test": true, "validation": "passed"}',
  '{"budget": 8, "authority": 6, "need": 9, "timeline": 7}'
FROM test_uuid
ON CONFLICT DO NOTHING
RETURNING id, current_stage, created_at;

-- 8. ✅ VERIFICAR SE A INSERÇÃO FUNCIONOU
SELECT 
  id,
  user_id,
  current_stage,
  stage_metadata,
  bant_score,
  created_at
FROM client_stages 
WHERE stage_metadata->>'test' = 'true'
LIMIT 5;

-- 9. ✅ CONTAGEM FINAL DE REGISTROS EM TODAS AS TABELAS
SELECT 
  'client_stages' as tabela, COUNT(*) as registros FROM client_stages
UNION ALL
SELECT 
  'interactions' as tabela, COUNT(*) as registros FROM interactions
UNION ALL
SELECT 
  'conversation_memory' as tabela, COUNT(*) as registros FROM conversation_memory
UNION ALL
SELECT 
  'area_diagnostics' as tabela, COUNT(*) as registros FROM area_diagnostics
UNION ALL
SELECT 
  'gamification' as tabela, COUNT(*) as registros FROM gamification
UNION ALL
SELECT 
  'client_goals' as tabela, COUNT(*) as registros FROM client_goals
UNION ALL
SELECT 
  'client_actions' as tabela, COUNT(*) as registros FROM client_actions;

-- 🎉 RESULTADO ESPERADO PARA IA COACH 100% FUNCIONAL:
-- ✅ 7 tabelas listadas
-- ✅ Estrutura com colunas corretas (UUID, JSONB, etc.)
-- ✅ Índices criados para performance
-- ✅ Políticas RLS ativas
-- ✅ Triggers de updated_at funcionando
-- ✅ Constraints e foreign keys configurados
-- ✅ 1 registro de teste inserido com sucesso
-- = SISTEMA IA COACH ESTRATÉGICO TOTALMENTE OPERACIONAL!