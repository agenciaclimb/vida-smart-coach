-- 2025-09-15_normalized_views.sql
-- Normalização de rewards e plans via views para blindar o frontend contra mudanças de schema

-- REWARDS view guarded for optional columns
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
    EXECUTE format('CREATE OR REPLACE VIEW public.rewards_normalized AS\nSELECT r.id, %s AS name, r.description, %s AS points, %s AS icon, %s AS is_active, r.created_at, r.updated_at\nFROM public.rewards r;', name_expr, points_expr, icon_expr, active_expr);
    EXECUTE 'GRANT SELECT ON public.rewards_normalized TO anon, authenticated';
    EXECUTE 'COMMENT ON VIEW public.rewards_normalized IS ''View normalizada para rewards - campos padronizados independente do schema base''';
  ELSE
    RAISE NOTICE 'Skipping rewards_normalized view creation: required columns not present on public.rewards.';
  END IF;
END;
$$;

-- PLANS view guarded for optional columns
DO $$
DECLARE
  has_title BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'title');
  has_details BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'details');
  has_amount BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'amount');
  has_is_available BOOLEAN := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'is_available');
  required_columns INTEGER := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plans' AND column_name IN ('id','name','description','price','is_active','created_at','updated_at'));
  name_expr TEXT;
  description_expr TEXT;
  price_expr TEXT;
  active_expr TEXT;
BEGIN
  IF required_columns = 7 THEN
    name_expr := CASE WHEN has_title THEN 'coalesce(p.name, p.title)' ELSE 'p.name' END;
    description_expr := CASE WHEN has_details THEN 'coalesce(p.description, p.details, '''')' ELSE 'coalesce(p.description, '''')' END;
    price_expr := CASE WHEN has_amount THEN 'coalesce(p.price, p.amount, 0)::numeric' ELSE 'coalesce(p.price, 0)::numeric' END;
    active_expr := CASE WHEN has_is_available THEN 'coalesce(p.is_active, p.is_available, true)' ELSE 'coalesce(p.is_active, true)' END;
    EXECUTE format('CREATE OR REPLACE VIEW public.plans_normalized AS\nSELECT p.id, %s AS name, %s AS description, %s AS price, %s AS is_active, p.created_at, p.updated_at\nFROM public.plans p;', name_expr, description_expr, price_expr, active_expr);
    EXECUTE 'GRANT SELECT ON public.plans_normalized TO anon, authenticated';
    EXECUTE 'COMMENT ON VIEW public.plans_normalized IS ''View normalizada para plans - campos padronizados independente do esquema base''';
  ELSE
    RAISE NOTICE 'Skipping plans_normalized view creation: required columns not present on public.plans.';
  END IF;
END;
$$;
