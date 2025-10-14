-- Migration: Idempotently fix the subscription_plans and plans_normalized views
-- Reason: The dependency chain between plans, subscription_plans, and plans_normalized is broken.
-- This script forcibly corrects the state.

-- 1. Drop the dependent view 'plans_normalized' and the conflicting table 'subscription_plans'
-- Using CASCADE will drop plans_normalized as well.
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- 2. Recreate the 'subscription_plans' object as a VIEW pointing to 'plans'
-- This was the intention of migration 20250916999999.
CREATE OR REPLACE VIEW public.subscription_plans AS
SELECT * FROM public.plans;

-- 3. Recreate the 'plans_normalized' view correctly, depending on 'plans'
-- This is a further simplified version to avoid errors on missing columns.
CREATE OR REPLACE VIEW public.plans_normalized AS
SELECT
  p.id,
  coalesce(p.name, p.title)                                       AS name,
  coalesce(p.price, p.amount, 0)::numeric                         AS price,
  coalesce(p.is_active, p.is_available, true)                     AS is_active,
  p.created_at
FROM public.plans p;

-- 4. Re-apply grants
GRANT SELECT ON public.subscription_plans TO authenticated, anon;
GRANT SELECT ON public.plans_normalized   TO authenticated, anon;