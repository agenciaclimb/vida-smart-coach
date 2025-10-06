-- 2025-09-15_normalized_views.sql
-- Normalização de rewards e plans via views para blindar o frontend contra mudanças de schema

-- REWARDS: padroniza como (id, name, points, icon, is_active, created_at, updated_at)
create or replace view public.rewards_normalized as
select
  r.id,
  coalesce(r.title, '')                                       as name,
  r.description,
  coalesce(r.points, r.points_required)                           as points,
  coalesce(r.icon, r.image_url)                                   as icon,
  coalesce(r.is_active, r.is_available, true)                     as is_active,
  r.created_at,
  r.updated_at
from public.rewards r;

-- PLANS: padroniza como (id, name, description, price, is_active, created_at, updated_at)
create or replace view public.plans_normalized as
select
  p.id,
  coalesce(p.title, p.name, '')                                   as name,
  coalesce(p.description, p.details, '')                          as description,
  coalesce(p.price, p.amount, 0)::numeric                         as price,
  coalesce(p.is_active, p.is_available, true)                     as is_active,
  p.created_at,
  p.updated_at
from public.plans p;

-- Permissões (ajuste se houver RLS restritivo nas tabelas-base)
grant select on public.rewards_normalized to anon, authenticated;
grant select on public.plans_normalized   to anon, authenticated;

-- Comentários para documentação
comment on view public.rewards_normalized is 'View normalizada para rewards - campos padronizados independente do schema base';
comment on view public.plans_normalized is 'View normalizada para plans - campos padronizados independente do schema base';