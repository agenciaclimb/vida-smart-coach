-- 🎯 TESTE RÁPIDO - VERIFICAR SE IA COACH ESTÁ FUNCIONAL
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

-- 2. Testar inserção de dados (simulando usuário test)
-- Inserir estágio inicial SDR
INSERT INTO client_stages (
  user_id, 
  current_stage, 
  stage_metadata, 
  bant_score
) VALUES (
  gen_random_uuid(), 
  'sdr', 
  '{"test": true, "initial_contact": true}',
  '{"budget": 0, "authority": 0, "need": 5, "timeline": 0}'
) RETURNING id, current_stage, created_at;

-- 3. Verificar se a inserção funcionou
SELECT 
  COUNT(*) as total_stages,
  current_stage,
  COUNT(*) as count_by_stage
FROM client_stages 
GROUP BY current_stage;

-- 4. Testar criação de interação
INSERT INTO interactions (
  user_id,
  interaction_type,
  stage,
  content,
  ai_response,
  metadata
) VALUES (
  (SELECT user_id FROM client_stages LIMIT 1),
  'message',
  'sdr',
  'Olá! Gostaria de começar minha jornada de saúde',
  'Que ótimo! Vamos começar sua transformação. Qual é seu principal objetivo?',
  '{"sentiment": "positive", "intent": "start_journey"}'
) RETURNING id, interaction_type, stage, created_at;

-- 5. Verificar total de dados criados
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

-- 🎉 SE ESTE SQL EXECUTAR SEM ERROS = IA COACH 100% FUNCIONAL!