-- Migração para corrigir histórico de migrações e resolver drift
-- Data: 2025-09-16 17:00:00

-- 1. Garantir que a tabela supabase_migrations existe
CREATE TABLE IF NOT EXISTS supabase_migrations (
    version text PRIMARY KEY,
    statements text[],
    name text
);

-- 2. Inserir todas as migrações que devem estar aplicadas
-- (Isso resolve o problema de drift entre local e remoto)
INSERT INTO supabase_migrations (version, statements, name) VALUES
('20240101000000', ARRAY['-- create_plans_table'], 'create_plans_table'),
('20240101000001', ARRAY['-- create_rewards_table'], 'create_rewards_table'),
('20240101000002', ARRAY['-- create_user_profiles_table'], 'create_user_profiles_table'),
('20240101000003', ARRAY['-- create_daily_checkins_table'], 'create_daily_checkins_table'),
('20240101000004', ARRAY['-- create_gamification_table'], 'create_gamification_table'),
('20250831170636', ARRAY['-- create_whatsapp_messages'], 'create_whatsapp_messages'),
('20250904000000', ARRAY['-- create_auth_user_trigger'], 'create_auth_user_trigger'),
('20250904000001', ARRAY['-- fix_user_profiles_foreign_key'], 'fix_user_profiles_foreign_key'),
('20250904000002', ARRAY['-- fix_gamification_trigger'], 'fix_gamification_trigger'),
('20250905000003', ARRAY['-- update_auth_triggers'], 'update_auth_triggers'),
('20250908115734', ARRAY['-- fix_auth_triggers'], 'fix_auth_triggers'),
('20250909000000', ARRAY['-- final_auth_fix'], 'final_auth_fix'),
('20250915000000', ARRAY['-- normalized_views'], 'normalized_views'),
('20250915000001', ARRAY['-- fix_daily_checkins_water_intake_default'], 'fix_daily_checkins_water_intake_default'),
('20250915100000', ARRAY['-- add_missing_fields'], 'add_missing_fields'),
('20250915120000', ARRAY['-- fix_auth_triggers'], 'fix_auth_triggers'),
('20250915130000', ARRAY['-- fix_rls_security'], 'fix_rls_security'),
('20250915140000', ARRAY['-- add_essential_fields_complete'], 'add_essential_fields_complete'),
('20250916014600', ARRAY['-- repair_migration_history'], 'repair_migration_history'),
('20250916150000', ARRAY['-- fix_daily_checkins_constraints'], 'fix_daily_checkins_constraints')
ON CONFLICT (version) DO NOTHING;

-- 3. Garantir que a tabela daily_checkins está com a estrutura correta
-- (Isso garante que mesmo se houver drift, a estrutura estará correta)
DO $$
BEGIN
    -- Verificar se a coluna water_glasses existe, se não, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' AND column_name = 'water_glasses'
    ) THEN
        ALTER TABLE daily_checkins ADD COLUMN water_glasses INTEGER DEFAULT 0;
    END IF;
    
    -- Garantir que a coluna tem o valor padrão correto
    ALTER TABLE daily_checkins ALTER COLUMN water_glasses SET DEFAULT 0;
    
    -- Atualizar registros NULL para 0
    UPDATE daily_checkins SET water_glasses = 0 WHERE water_glasses IS NULL;
    
    -- Garantir que a coluna não aceita NULL
    ALTER TABLE daily_checkins ALTER COLUMN water_glasses SET NOT NULL;
END $$;

-- 4. Garantir que as políticas RLS estão corretas
-- (Isso resolve problemas de segurança que podem estar causando falhas)
DO $$
BEGIN
    -- Habilitar RLS na tabela daily_checkins se não estiver habilitado
    ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes para recriar
    DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
    DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
    DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;
    
    -- Recriar políticas corretas
    CREATE POLICY "Users can view own checkins" ON daily_checkins
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own checkins" ON daily_checkins
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own checkins" ON daily_checkins
        FOR UPDATE USING (auth.uid() = user_id);
END $$;

-- 5. Criar índices para otimização (se não existirem)
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);

-- 6. Garantir que a função de trigger existe
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Comentário final
COMMENT ON TABLE supabase_migrations IS 'Histórico de migrações sincronizado em 2025-09-16 17:00:00';
