-- 🔥 MIGRAÇÃO ESSENCIAL - EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- 📍 URL: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new
-- 📋 COPIE E COLE ESTE CÓDIGO COMPLETO, DEPOIS CLIQUE "RUN"

-- ✅ 1. ADICIONAR CAMPOS ESSENCIAIS AO PERFIL DO CLIENTE
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);

-- ✅ 2. ADICIONAR CAMPOS ESSENCIAIS AO CHECK-IN DIÁRIO
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS mood_score INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ✅ 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_weight ON user_profiles(current_weight);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_weight ON daily_checkins(weight);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_mood_score ON daily_checkins(mood_score);

-- ✅ 4. ADICIONAR TRIGGER PARA UPDATE AUTOMÁTICO DE TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 🎉 PRONTO! APÓS EXECUTAR ESTE SQL, TODOS OS CAMPOS ESSENCIAIS ESTARÃO DISPONÍVEIS