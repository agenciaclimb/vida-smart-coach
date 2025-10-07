-- =====================================================
-- MIGRAÇÃO: Corrigir constraints da tabela daily_checkins
-- Data: 2025-09-16 15:00:00
-- Objetivo: Resolver problemas de constraint NOT NULL no campo mood
-- =====================================================

-- Primeiro, vamos verificar se a tabela existe e sua estrutura atual
DO $$
BEGIN
    -- Se a tabela não existir, criar ela
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_checkins') THEN
        CREATE TABLE daily_checkins (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            weight DECIMAL(5,2),
            mood TEXT,
            sleep_hours INTEGER,
            water_glasses INTEGER DEFAULT 0,
            exercise_minutes INTEGER DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela daily_checkins criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela daily_checkins já existe';
    END IF;
END $$;

-- Remover constraint NOT NULL do campo mood se existir
ALTER TABLE daily_checkins ALTER COLUMN mood DROP NOT NULL;

-- Garantir que os campos essenciais tenham valores padrão apropriados
ALTER TABLE daily_checkins ALTER COLUMN water_glasses SET DEFAULT 0;
ALTER TABLE daily_checkins ALTER COLUMN exercise_minutes SET DEFAULT 0;
ALTER TABLE daily_checkins ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);

-- Criar constraint única para evitar múltiplos check-ins no mesmo dia
ALTER TABLE daily_checkins DROP CONSTRAINT IF EXISTS unique_user_date_checkin;
ALTER TABLE daily_checkins ADD CONSTRAINT unique_user_date_checkin UNIQUE(user_id, date);

-- Configurar RLS (Row Level Security)
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON daily_checkins;

-- Criar políticas RLS
CREATE POLICY "Users can view own checkins" ON daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON daily_checkins
    FOR DELETE USING (auth.uid() = user_id);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_daily_checkins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_daily_checkins_updated_at_trigger ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at_trigger
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_checkins_updated_at();

-- Verificar se tudo foi criado corretamente
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_checkins') THEN
        RAISE NOTICE '✅ Tabela daily_checkins configurada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Erro: Tabela daily_checkins não foi criada';
    END IF;
    
    -- Verificar se as políticas foram criadas
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'daily_checkins') THEN
        RAISE NOTICE '✅ Políticas RLS configuradas com sucesso';
    ELSE
        RAISE NOTICE '⚠️ Aviso: Políticas RLS podem não ter sido criadas';
    END IF;
END $$;

-- Inserir dados de teste para validação (opcional)
INSERT INTO daily_checkins (user_id, date, weight, mood, sleep_hours, water_glasses, exercise_minutes, notes)
SELECT 
    auth.uid(),
    CURRENT_DATE,
    75.5,
    'Bom',
    8,
    6,
    30,
    'Check-in de teste após correção'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, date) DO UPDATE SET
    weight = EXCLUDED.weight,
    mood = EXCLUDED.mood,
    sleep_hours = EXCLUDED.sleep_hours,
    water_glasses = EXCLUDED.water_glasses,
    exercise_minutes = EXCLUDED.exercise_minutes,
    notes = EXCLUDED.notes,
    updated_at = NOW();

RAISE NOTICE '🎉 Migração daily_checkins concluída com sucesso!';

