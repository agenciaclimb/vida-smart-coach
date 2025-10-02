-- Idempotência de webhooks Stripe
-- Date: 2025-09-28
-- Purpose: Rastreia eventos Stripe já processados para evitar duplicação

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índice para busca rápida por event_id
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(event_id);

-- Comentários para documentação
COMMENT ON TABLE public.stripe_events IS 'Rastreia eventos Stripe já processados (idempotência)';
COMMENT ON COLUMN public.stripe_events.event_id IS 'ID único do evento Stripe (evt_...)';
COMMENT ON COLUMN public.stripe_events.processed_at IS 'Timestamp quando o evento foi processado';
COMMENT ON COLUMN public.stripe_events.created_at IS 'Timestamp de criação do registro';

-- Habilitar RLS (Row Level Security)
-- Service role ignora RLS por definição, apenas webhooks server-side conseguem inserir
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Opcional: Política para permitir apenas service role (redundante, mas explícita)
-- CREATE POLICY "Service role only" ON public.stripe_events
--   FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');