-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- Migração: Add notification preferences to user_profiles

-- Verificar se as colunas já existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('wants_reminders', 'wants_quotes');

-- Se as colunas não existirem, execute os comandos abaixo:

-- 1. Adicionar as colunas
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS wants_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wants_quotes BOOLEAN DEFAULT true;

-- 2. Atualizar usuários existentes
UPDATE user_profiles 
SET 
    wants_reminders = COALESCE(wants_reminders, true),
    wants_quotes = COALESCE(wants_quotes, true)
WHERE wants_reminders IS NULL OR wants_quotes IS NULL;

-- 3. Verificar que funcionou
SELECT id, name, wants_reminders, wants_quotes 
FROM user_profiles 
LIMIT 5;

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN user_profiles.wants_reminders IS 'User preference for receiving check-in reminders';
COMMENT ON COLUMN user_profiles.wants_quotes IS 'User preference for receiving motivational quotes';