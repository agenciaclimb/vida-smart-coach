-- 🔧 CORREÇÃO SQL - Adicionar campo timestamp na tabela whatsapp_messages
-- Execute este SQL no Supabase SQL Editor

-- Verificar estrutura atual da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_messages';

-- Se o campo timestamp não existir, adicionar
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;

-- Verificar se foi adicionado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_messages';

-- Atualizar registros existentes que não têm timestamp
UPDATE whatsapp_messages 
SET timestamp = EXTRACT(EPOCH FROM created_at) * 1000 
WHERE timestamp IS NULL AND created_at IS NOT NULL;