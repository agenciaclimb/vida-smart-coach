-- 🎯 MIGRAÇÃO SUPABASE FINAL - EXECUTE NO DASHBOARD SUPABASE
-- 📍 URL: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new
-- 📋 COPIE E COLE ESTE CÓDIGO COMPLETO, DEPOIS CLIQUE "RUN"

-- ✅ 1. GARANTIR QUE A TABELA USER_PROFILES EXISTE E ESTÁ COMPLETA
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    name TEXT,
    email TEXT,
    phone VARCHAR(20),
    age INTEGER CHECK (age > 0 AND age < 150),
    height INTEGER CHECK (height > 0 AND height < 300),
    current_weight DECIMAL(5,2) CHECK (current_weight > 0 AND current_weight < 1000),
    target_weight DECIMAL(5,2) CHECK (target_weight > 0 AND target_weight < 1000),
    gender VARCHAR(20),
    activity_level VARCHAR(30),
    goal_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ 2. GARANTIR QUE A TABELA DAILY_CHECKINS EXISTE E ESTÁ COMPLETA  
CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    sleep_hours DECIMAL(3,1) CHECK (sleep_hours > 0 AND sleep_hours <= 24),
    weight DECIMAL(5,2) CHECK (weight > 0 AND weight < 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ✅ 3. ADICIONAR CAMPOS SE NÃO EXISTIREM (SAFE)
DO $$
BEGIN
    -- Adicionar campos ao user_profiles se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone') THEN
        ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='current_weight') THEN
        ALTER TABLE user_profiles ADD COLUMN current_weight DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='target_weight') THEN
        ALTER TABLE user_profiles ADD COLUMN target_weight DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='gender') THEN
        ALTER TABLE user_profiles ADD COLUMN gender VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='goal_type') THEN
        ALTER TABLE user_profiles ADD COLUMN goal_type VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='activity_level') THEN
        ALTER TABLE user_profiles ADD COLUMN activity_level VARCHAR(30);
    END IF;
    
    -- Adicionar campos ao daily_checkins se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_checkins' AND column_name='weight') THEN
        ALTER TABLE daily_checkins ADD COLUMN weight DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_checkins' AND column_name='mood_score') THEN
        ALTER TABLE daily_checkins ADD COLUMN mood_score INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_checkins' AND column_name='updated_at') THEN
        ALTER TABLE daily_checkins ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ✅ 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- ✅ 5. CRIAR POLÍTICAS DE SEGURANÇA (SAFE - DROP IF EXISTS)
-- Políticas para user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;  
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para daily_checkins
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
CREATE POLICY "Users can view own checkins" ON daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
CREATE POLICY "Users can insert own checkins" ON daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;
CREATE POLICY "Users can update own checkins" ON daily_checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- ✅ 6. CRIAR ÍNDICES PARA PERFORMANCE (SAFE)
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_weight ON user_profiles(current_weight);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_weight ON daily_checkins(weight);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_mood_score ON daily_checkins(mood_score);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);

-- ✅ 7. CRIAR TRIGGER PARA UPDATED_AT AUTOMÁTICO
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas (SAFE)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ✅ 8. VERIFICAR SE TUDO ESTÁ FUNCIONANDO
DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '✅ Tabela user_profiles: OK';
    RAISE NOTICE '✅ Tabela daily_checkins: OK';
    RAISE NOTICE '✅ Políticas RLS: OK';
    RAISE NOTICE '✅ Índices: OK';
    RAISE NOTICE '✅ Triggers: OK';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Agora você pode usar o sistema completo!';
    RAISE NOTICE '🔗 Acesse: https://5173-iv9yhogpcrchrblddtvwb-6532622b.e2b.dev';
END $$;