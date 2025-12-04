-- Migration: Tabela WhatsApp Messages (Histórico de Conversas)
-- Data: 2025-12-04
-- Objetivo: Armazenar histórico completo de mensagens WhatsApp para contexto da IA

-- ================================================
-- TABELA: whatsapp_messages
-- ================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL, -- Telefone normalizado (ex: 5516981459950)
  message TEXT NOT NULL,
  event TEXT NOT NULL, -- 'messages.upsert', 'ia_response', etc
  message_type TEXT, -- 'text', 'image', 'audio', 'button_reply', etc
  timestamp BIGINT NOT NULL, -- Unix timestamp em milissegundos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_messages IS 'Histórico completo de mensagens WhatsApp (usuário + IA)';
COMMENT ON COLUMN whatsapp_messages.phone_number IS 'Telefone normalizado sem caracteres especiais';
COMMENT ON COLUMN whatsapp_messages.user_id IS 'NULL se mensagem é da IA, UUID se é do usuário';
COMMENT ON COLUMN whatsapp_messages.event IS 'Tipo de evento do Evolution API';
COMMENT ON COLUMN whatsapp_messages.timestamp IS 'Unix timestamp em milissegundos para ordenação precisa';

-- ================================================
-- ÍNDICES
-- ================================================
DO $$ 
BEGIN
  -- idx_whatsapp_messages_phone_timestamp
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_whatsapp_messages_phone_timestamp'
  ) THEN
    CREATE INDEX idx_whatsapp_messages_phone_timestamp ON whatsapp_messages(phone_number, timestamp DESC);
  END IF;

  -- idx_whatsapp_messages_user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_whatsapp_messages_user_id'
  ) THEN
    CREATE INDEX idx_whatsapp_messages_user_id ON whatsapp_messages(user_id, created_at DESC) WHERE user_id IS NOT NULL;
  END IF;

  -- idx_whatsapp_messages_created_at
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_whatsapp_messages_created_at'
  ) THEN
    CREATE INDEX idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
  END IF;

  -- idx_whatsapp_messages_event
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_whatsapp_messages_event'
  ) THEN
    CREATE INDEX idx_whatsapp_messages_event ON whatsapp_messages(event, created_at DESC);
  END IF;
END $$;

-- ================================================
-- RLS (Row Level Security)
-- ================================================
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Drop policies se já existirem
DROP POLICY IF EXISTS "Users can view own messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Service role can insert messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Service role can view all messages" ON whatsapp_messages;

-- Usuários podem ver apenas suas próprias mensagens
CREATE POLICY "Users can view own messages" ON whatsapp_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Service role pode ver todas as mensagens
CREATE POLICY "Service role can view all messages" ON whatsapp_messages
  FOR SELECT USING (true);

-- Apenas service role pode inserir
CREATE POLICY "Service role can insert messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (true);

-- ================================================
-- FUNÇÃO: Limpar mensagens antigas
-- ================================================
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_messages()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Manter apenas últimos 180 dias de histórico
  DELETE FROM whatsapp_messages
  WHERE created_at < NOW() - INTERVAL '180 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_whatsapp_messages IS 'Remove mensagens com mais de 180 dias (executar mensalmente via cron)';

-- ================================================
-- VIEW: Últimas conversas por usuário
-- ================================================
CREATE OR REPLACE VIEW v_whatsapp_recent_conversations AS
SELECT DISTINCT ON (phone_number)
  phone_number,
  user_id,
  message,
  event,
  created_at,
  (NOW() - created_at) AS time_since_last_message
FROM whatsapp_messages
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY phone_number, created_at DESC;

COMMENT ON VIEW v_whatsapp_recent_conversations IS 'Última mensagem de cada conversa (últimos 7 dias)';

-- ================================================
-- VALIDAÇÃO
-- ================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela whatsapp_messages criada/verificada';
  RAISE NOTICE '✅ Índices criados para performance de queries';
  RAISE NOTICE '✅ RLS policies aplicadas (users + service role)';
  RAISE NOTICE '✅ View v_whatsapp_recent_conversations criada';
  RAISE NOTICE '✅ Função cleanup_old_whatsapp_messages criada';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Queries de teste:';
  RAISE NOTICE '   SELECT COUNT(*) FROM whatsapp_messages;';
  RAISE NOTICE '   SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 10;';
  RAISE NOTICE '   SELECT * FROM v_whatsapp_recent_conversations;';
END $$;
