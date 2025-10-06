-- Recreate stripe_events with required columns
DROP TABLE IF EXISTS public.stripe_events;

CREATE TABLE public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id
  ON public.stripe_events(event_id);
