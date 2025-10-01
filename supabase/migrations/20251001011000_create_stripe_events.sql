-- Create stripe_events table for webhook idempotency
-- Date: 2025-10-01

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id
  ON public.stripe_events(event_id);

COMMENT ON TABLE public.stripe_events IS 'Rastreia eventos Stripe já processados (idempotência)';
COMMENT ON COLUMN public.stripe_events.event_id IS 'ID único do evento Stripe (evt_...)';
COMMENT ON COLUMN public.stripe_events.processed_at IS 'Timestamp quando o evento foi processado';
COMMENT ON COLUMN public.stripe_events.created_at IS 'Timestamp de criação do registro';

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
