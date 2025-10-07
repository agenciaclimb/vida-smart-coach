-- 🔧 CORREÇÃO DAS CONSTRAINTS ACTIVITY_LEVEL E GOAL_TYPE
-- 📍 Execute este SQL no Supabase Dashboard para corrigir os valores aceitos
-- 🎯 Resolve erro 400 "Bad Request" no POST /rest/v1/user_profiles

BEGIN;

-- ✅ 1. REMOVER CONSTRAINTS ANTIGAS SE EXISTIREM
DO $$
BEGIN
    -- Remove constraint de activity_level se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%activity_level%' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_activity_level_check;
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS check_activity_level;
        RAISE NOTICE 'Removed old activity_level constraints';
    END IF;
    
    -- Remove constraint de goal_type se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%goal_type%' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_goal_type_check;
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS check_goal_type;
        RAISE NOTICE 'Removed old goal_type constraints';
    END IF;
END $$;

-- ✅ 2. GARANTIR QUE OS CAMPOS EXISTEM COM TIPO CORRETO
DO $$
BEGIN
    -- Verificar se activity_level existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'activity_level'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN activity_level VARCHAR(30);
        RAISE NOTICE 'Added activity_level column';
    END IF;
    
    -- Verificar se goal_type existe  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'goal_type'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN goal_type VARCHAR(50);
        RAISE NOTICE 'Added goal_type column';
    END IF;
END $$;

-- ✅ 3. LIMPAR DADOS INVÁLIDOS EXISTENTES
UPDATE user_profiles 
SET activity_level = CASE 
    WHEN activity_level IN ('sedentário', 'sedentario') THEN 'sedentary'
    WHEN activity_level = 'levemente ativo' THEN 'light'  
    WHEN activity_level = 'moderadamente ativo' THEN 'moderate'
    WHEN activity_level = 'muito ativo' THEN 'very_active'
    WHEN activity_level = 'extremamente ativo' THEN 'super_active'
    WHEN activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'super_active') THEN activity_level
    ELSE 'moderate' -- default para valores inválidos
END
WHERE activity_level IS NOT NULL;

UPDATE user_profiles 
SET goal_type = CASE 
    WHEN goal_type IN ('perder peso', 'perder_peso') THEN 'lose_weight'
    WHEN goal_type IN ('ganhar massa muscular', 'ganhar_massa') THEN 'gain_muscle'
    WHEN goal_type IN ('manter peso atual', 'manter_peso') THEN 'maintain_weight'
    WHEN goal_type IN ('melhorar condicionamento', 'melhorar_condicionamento') THEN 'improve_fitness'
    WHEN goal_type IN ('saúde geral', 'saude_geral') THEN 'general_health'
    WHEN goal_type IN ('lose_weight', 'gain_muscle', 'maintain_weight', 'improve_fitness', 'general_health') THEN goal_type
    ELSE 'general_health' -- default para valores inválidos
END
WHERE goal_type IS NOT NULL;

-- ✅ 4. CRIAR CONSTRAINTS CORRETAS
ALTER TABLE user_profiles 
ADD CONSTRAINT check_activity_level 
CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'super_active') OR activity_level IS NULL);

ALTER TABLE user_profiles 
ADD CONSTRAINT check_goal_type 
CHECK (goal_type IN ('lose_weight', 'gain_muscle', 'maintain_weight', 'improve_fitness', 'general_health') OR goal_type IS NULL);

-- ✅ 5. ATUALIZAR A FUNÇÃO SAFE_UPSERT PARA USAR OS SLUGS CORRETOS
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL,
    p_age INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL,
    p_current_weight DECIMAL(5,2) DEFAULT NULL,
    p_target_weight DECIMAL(5,2) DEFAULT NULL,
    p_gender VARCHAR(20) DEFAULT NULL,
    p_activity_level VARCHAR(30) DEFAULT NULL,
    p_goal_type VARCHAR(50) DEFAULT NULL
)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
    normalized_activity_level VARCHAR(30);
    normalized_goal_type VARCHAR(50);
BEGIN
    -- Validar e normalizar activity_level
    normalized_activity_level := CASE 
        WHEN p_activity_level IN ('sedentário', 'sedentario') THEN 'sedentary'
        WHEN p_activity_level = 'levemente ativo' THEN 'light'
        WHEN p_activity_level = 'moderadamente ativo' THEN 'moderate'
        WHEN p_activity_level = 'muito ativo' THEN 'very_active'
        WHEN p_activity_level = 'extremamente ativo' THEN 'super_active'
        WHEN p_activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'super_active') THEN p_activity_level
        ELSE NULL
    END;
    
    -- Validar e normalizar goal_type
    normalized_goal_type := CASE 
        WHEN p_goal_type IN ('perder peso', 'perder_peso') THEN 'lose_weight'
        WHEN p_goal_type IN ('ganhar massa muscular', 'ganhar_massa') THEN 'gain_muscle'
        WHEN p_goal_type IN ('manter peso atual', 'manter_peso') THEN 'maintain_weight'
        WHEN p_goal_type IN ('melhorar condicionamento', 'melhorar_condicionamento') THEN 'improve_fitness'
        WHEN p_goal_type IN ('saúde geral', 'saude_geral') THEN 'general_health'
        WHEN p_goal_type IN ('lose_weight', 'gain_muscle', 'maintain_weight', 'improve_fitness', 'general_health') THEN p_goal_type
        ELSE NULL
    END;

    -- Validar outros campos
    IF p_age IS NOT NULL AND (p_age < 1 OR p_age > 150) THEN
        RAISE EXCEPTION 'Age must be between 1 and 150';
    END IF;
    
    IF p_height IS NOT NULL AND (p_height < 1 OR p_height > 300) THEN
        RAISE EXCEPTION 'Height must be between 1 and 300 cm';
    END IF;
    
    IF p_current_weight IS NOT NULL AND (p_current_weight < 1 OR p_current_weight > 1000) THEN
        RAISE EXCEPTION 'Current weight must be between 1 and 1000 kg';
    END IF;
    
    IF p_target_weight IS NOT NULL AND (p_target_weight < 1 OR p_target_weight > 1000) THEN
        RAISE EXCEPTION 'Target weight must be between 1 and 1000 kg';
    END IF;

    -- Safe upsert
    INSERT INTO user_profiles (
        id, full_name, name, email, phone, age, height, 
        current_weight, target_weight, gender, activity_level, goal_type,
        created_at, updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        COALESCE(p_name, p_full_name),
        p_email,
        p_phone,
        p_age,
        p_height,
        p_current_weight,
        p_target_weight,
        p_gender,
        normalized_activity_level,
        normalized_goal_type,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        name = COALESCE(EXCLUDED.name, EXCLUDED.full_name, user_profiles.name),
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        age = COALESCE(EXCLUDED.age, user_profiles.age),
        height = COALESCE(EXCLUDED.height, user_profiles.height),
        current_weight = COALESCE(EXCLUDED.current_weight, user_profiles.current_weight),
        target_weight = COALESCE(EXCLUDED.target_weight, user_profiles.target_weight),
        gender = COALESCE(EXCLUDED.gender, user_profiles.gender),
        activity_level = COALESCE(EXCLUDED.activity_level, user_profiles.activity_level),
        goal_type = COALESCE(EXCLUDED.goal_type, user_profiles.goal_type),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ✅ 6. MENSAGEM DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ACTIVITY_LEVEL E GOAL_TYPE CONSTRAINTS CORRIGIDOS!';
    RAISE NOTICE '✅ Activity levels aceitos: sedentary, light, moderate, very_active, super_active';
    RAISE NOTICE '✅ Goal types aceitos: lose_weight, gain_muscle, maintain_weight, improve_fitness, general_health';
    RAISE NOTICE '✅ Função safe_upsert_user_profile atualizada com normalização';
    RAISE NOTICE '✅ Dados existentes migrados para os novos valores';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Teste agora salvando o perfil no dashboard!';
    RAISE NOTICE '📱 O erro 400 deve estar resolvido';
END $$;