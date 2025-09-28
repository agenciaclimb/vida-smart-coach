-- Idempotência de webhooks Stripe
-- Date: 2025-09-28
-- Purpose: Rastrear eventos Stripe já processados para evitar duplicação

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índice para busca rápida por event_id
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(event_id);

-- Índice para limpeza por data (opcional, para manutenção futura)
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at ON public.stripe_events(processed_at);

-- Comentários para documentação
COMMENT ON TABLE public.stripe_events IS 'Rastreia eventos Stripe já processados (idempotência)';
COMMENT ON COLUMN public.stripe_events.event_id IS 'ID único do evento Stripe (evt_...)';
COMMENT ON COLUMN public.stripe_events.processed_at IS 'Timestamp de quando o evento foi processado';
COMMENT ON COLUMN public.stripe_events.created_at IS 'Timestamp de criação do registro';

-- RLS habilitado - Service role ignora RLS automaticamente
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Não criamos políticas RLS propositalmente:
-- - Service role (webhook) ignora RLS por definição
-- - Usuários autenticados não terão acesso direto a esta tabela
-- - Apenas o webhook server consegue inserir/consultar