-- DIAGNÓSTICO COMPLETO DOS ERROS SUPABASE
-- Execute no SQL Editor do Supabase para identificar problemas

-- 1. Verificar se as colunas de notificação existem
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('wants_reminders', 'wants_quotes');

-- 2. Verificar configurações da tabela user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Verificar se há dados de planos corrompidos
SELECT 
    id,
    user_id, 
    CASE 
        WHEN plan_data IS NULL THEN 'NULL'
        WHEN plan_data = '' THEN 'EMPTY'
        WHEN plan_data = '{}' THEN 'EMPTY_OBJECT'
        WHEN LENGTH(plan_data::text) < 50 THEN 'TOO_SHORT'
        ELSE 'VALID'
    END as plan_status,
    LENGTH(plan_data::text) as data_length,
    created_at
FROM user_training_plans 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar usuários sem planos
SELECT 
    up.id,
    up.full_name,
    up.goal_type,
    COUNT(utp.id) as plan_count
FROM user_profiles up
LEFT JOIN user_training_plans utp ON up.id = utp.user_id
GROUP BY up.id, up.full_name, up.goal_type
HAVING COUNT(utp.id) = 0
LIMIT 5;

-- 5. Verificar conexões ativas e possíveis problemas
SELECT 
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

-- 6. Verificar erros recentes nas functions
SELECT schemaname, functionname, calls, total_time, mean_time
FROM pg_stat_user_functions 
ORDER BY total_time DESC
LIMIT 10;