-- Stripe webhook idempotency log
-- Date: 2025-09-28
-- Purpose: track Stripe events already processed to avoid duplicates

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  processed_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_stripe_events_event_id on public.stripe_events(event_id);

comment on table public.stripe_events is 'Tracks processed Stripe events to guarantee idempotency.';
comment on column public.stripe_events.event_id is 'Stripe event id (evt_...).';
comment on column public.stripe_events.processed_at is 'Timestamp when the event was handled.';
comment on column public.stripe_events.created_at is 'Creation timestamp.';

alter table public.stripe_events enable row level security;
-- Service role bypasses RLS by default; explicit policy kept for clarity.
-- create policy "Service role only" on public.stripe_events
--   for all using (auth.jwt() ->> 'role' = 'service_role');