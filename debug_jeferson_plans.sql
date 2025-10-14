-- INVESTIGAÇÃO ESPECÍFICA - PLANOS DO JEFERSON
-- Execute no Supabase SQL Editor para debug

-- 1. Verificar perfil do Jeferson
SELECT 
    id, 
    full_name, 
    goal_type, 
    activity_level,
    created_at
FROM user_profiles 
WHERE full_name ILIKE '%jeferson%' OR full_name ILIKE '%costa%';

-- 2. Verificar planos do usuário específico (substitua USER_ID pelo ID encontrado acima)
-- SUBSTITUIR 'SEU_USER_ID_AQUI' pelo ID real do Jeferson
SELECT 
    id,
    user_id,
    plan_type,
    is_active,
    plan_data,
    LENGTH(plan_data::text) as data_length,
    created_at,
    CASE 
        WHEN plan_data IS NULL THEN 'NULL'
        WHEN plan_data::text = '' THEN 'EMPTY_STRING'
        WHEN plan_data::text = '{}' THEN 'EMPTY_OBJECT'
        WHEN LENGTH(plan_data::text) < 50 THEN 'TOO_SHORT'
        ELSE 'SEEMS_VALID'
    END as data_status
FROM user_training_plans 
WHERE user_id = (
    SELECT id FROM user_profiles 
    WHERE full_name ILIKE '%jeferson%' 
    LIMIT 1
)
ORDER BY created_at DESC;

-- 3. Verificar estrutura dos dados do plano
SELECT 
    id,
    plan_type,
    jsonb_typeof(plan_data) as data_type,
    jsonb_object_keys(plan_data) as keys
FROM user_training_plans 
WHERE user_id = (
    SELECT id FROM user_profiles 
    WHERE full_name ILIKE '%jeferson%' 
    LIMIT 1
)
AND plan_data IS NOT NULL
AND jsonb_typeof(plan_data) = 'object';

-- 4. Se houver plano, mostrar conteúdo resumido
SELECT 
    id,
    plan_type,
    plan_data->'title' as title,
    plan_data->'description' as description,
    jsonb_array_length(plan_data->'exercises') as exercise_count
FROM user_training_plans 
WHERE user_id = (
    SELECT id FROM user_profiles 
    WHERE full_name ILIKE '%jeferson%' 
    LIMIT 1
)
AND plan_data IS NOT NULL;