-- VIEW determinística (idempotente)
drop view if exists public.plans_normalized cascade;

create or replace view public.plans_normalized as
select
  p.id                                                   as plan_id,
  p.stripe_price_id,
  coalesce(p.features->>'name', initcap(p.id::text))           as name,
  coalesce(p.features->>'tier', p.id::text)                    as tier,
  coalesce((p.features->>'points_multiplier')::numeric,1) as points_multiplier,
  coalesce((p.features->>'trial_days')::int, 0)          as trial_days,
  p.features
from public.subscription_plans p;

alter table public.whatsapp_messages
  add column if not exists external_id text;

-- Índice de idempotência (não quebra se já existir)
create unique index if not exists idx_whatsapp_messages_external_id
  on public.whatsapp_messages(external_id);
