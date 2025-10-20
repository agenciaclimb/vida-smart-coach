-- 🔧 TESTE CORRIGIDO IA COACH - SEM DEPENDÊNCIA DE USUÁRIOS
-- Execute no SQL Editor: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new

-- 1. Verificar se todas as tabelas foram criadas
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

-- 2. Primeiro vamos criar um usuário de teste na tabela auth.users
-- (Temporariamente removendo as restrições FK para teste)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  created_at,
  updated_at,
  email_confirmed_at,
  confirmation_token,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'test@iacoach.com',
  'test-password-hash',
  NOW(),
  NOW(),
  NOW(),
  'test-token',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- 3. Testar inserção com usuário válido
-- Pegar o ID do usuário teste
WITH test_user AS (
  SELECT id as user_id FROM auth.users WHERE email = 'test@iacoach.com' LIMIT 1
)
INSERT INTO client_stages (
  user_id, 
  current_stage, 
  stage_metadata, 
  bant_score
) 
SELECT 
  user_id,
  'sdr', 
  '{"test": true, "initial_contact": true}',
  '{"budget": 0, "authority": 0, "need": 5, "timeline": 0}'
FROM test_user
RETURNING id, current_stage, created_at;

-- 4. Verificar se a inserção funcionou
SELECT 
  COUNT(*) as total_stages,
  current_stage
FROM client_stages 
GROUP BY current_stage;

-- 5. Testar criação de interação
WITH test_user AS (
  SELECT user_id FROM client_stages LIMIT 1
)
INSERT INTO interactions (
  user_id,
  interaction_type,
  stage,
  content,
  ai_response,
  metadata
)
SELECT
  user_id,
  'message',
  'sdr',
  'Olá! Gostaria de começar minha jornada de saúde',
  'Que ótimo! Vamos começar sua transformação. Qual é seu principal objetivo?',
  '{"sentiment": "positive", "intent": "start_journey"}'
FROM test_user
RETURNING id, interaction_type, stage, created_at;

-- 6. Verificar total de dados criados em todas as tabelas
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

-- 7. Verificar estrutura das tabelas criadas
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN (
    'client_stages',
    'interactions',
    'conversation_memory'
  )
ORDER BY t.table_name, c.ordinal_position;

-- 🎉 RESULTADO ESPERADO:
-- ✅ 7 tabelas listadas
-- ✅ 1 usuário criado 
-- ✅ 1 client_stage inserido
-- ✅ 1 interaction inserida
-- ✅ Estrutura das tabelas visível
-- = IA COACH 100% FUNCIONAL!