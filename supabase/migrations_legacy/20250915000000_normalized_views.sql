-- 2025-09-15_normalized_views.sql
-- Normalizacao de rewards e plans via views para blindar o frontend contra mudancas de schema

-- REWARDS view guardada para colunas opcionais
DO $$
DECLARE
  has_title BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'title');
  has_points_required BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'points_required');
  has_image_url BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'image_url');
  has_is_available BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'is_available');
  required_columns INTEGER := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name IN ('id','name','description','points','icon','is_active','created_at','updated_at'));
  name_expr TEXT;
  points_expr TEXT;
  icon_expr TEXT;
  active_expr TEXT;
BEGIN
  IF required_columns = 8 THEN
    name_expr := CASE WHEN has_title THEN 'coalesce(r.name, r.title)' ELSE 'r.name' END;
    points_expr := CASE WHEN has_points_required THEN 'coalesce(r.points, r.points_required)' ELSE 'r.points' END;
    icon_expr := CASE WHEN has_image_url THEN 'coalesce(r.icon, r.image_url)' ELSE 'r.icon' END;
    active_expr := CASE WHEN has_is_available THEN 'coalesce(r.is_active, r.is_available, true)' ELSE 'coalesce(r.is_active, true)' END;
    EXECUTE format('CREATE OR REPLACE VIEW public.rewards_normalized AS
SELECT r.id, %s AS name, r.description, %s AS points, %s AS icon, %s AS is_active, r.created_at, r.updated_at
FROM public.rewards r;', name_expr, points_expr, icon_expr, active_expr);
    EXECUTE 'GRANT SELECT ON public.rewards_normalized TO anon, authenticated';
    EXECUTE 'COMMENT ON VIEW public.rewards_normalized IS ''View normalizada para rewards - campos padronizados independente do schema base''';
  ELSE
    RAISE NOTICE 'Skipping rewards_normalized view creation: required columns not present on public.rewards.';
  END IF;
END;
$$;

-- Garantia minima da tabela subscription_plans para evitar falha ao criar view
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  stripe_price_id text,
  price numeric(10,2) DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Normalized view para exibir planos de forma "queryavel" no frontend
drop view if exists public.plans_normalized cascade;

CREATE OR REPLACE VIEW public.plans_normalized as
select
  p.id                               as plan_id,
  p.stripe_price_id,
  coalesce(p.features->>'name', initcap(p.id::text))               as name,
  coalesce(p.features->>'tier', p.id::text)                        as tier,
  coalesce( (p.features->>'points_multiplier')::numeric, 1 )      as points_multiplier,
  coalesce( (p.features->>'trial_days')::int, 0 )                 as trial_days,
  p.features
from public.subscription_plans p;

comment on view public.plans_normalized is 'View normalizada para plans - campos padronizados (schema atual)';

grant select on public.plans_normalized to anon, authenticated;
