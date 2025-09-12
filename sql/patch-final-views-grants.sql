-- ===============================================
-- 🎯 PATCH FINAL - VIEWS UNIFICADAS E GRANTS
-- ===============================================
-- Cria view unificada esperada pelo frontend
-- Aplica grants corretos para role authenticated

-- 2.1 View unificada esperada pelo frontend
-- Tabelas existentes confirmadas:
-- - public.nutrition_plans (id, user_id, title, plan jsonb, created_at timestamptz)
-- - public.training_plans (id, user_id, title, plan jsonb, created_at timestamptz)  
-- - public.plan_days (id, plan_id, day_index, focus text, workout jsonb, habit jsonb, nutrition jsonb, sleep jsonb, minutes int, created_at timestamptz)
-- - public.plans (id, user_id, title, plan jsonb, created_at timestamptz)

-- DROP VIEW IF EXISTS public.public_app_plans CASCADE;
CREATE OR REPLACE VIEW public.public_app_plans AS
/* 1) Nutrição (plan = jsonb) */
SELECT
  'nutrition'::text          AS type,
  np.id::uuid                AS id,
  np.user_id::uuid           AS owner_id,
  np.title::text             AS title,
  np.plan::jsonb             AS plan,
  NULL::int                  AS day_index,
  NULL::text                 AS focus,
  NULL::jsonb                AS workout,
  NULL::jsonb                AS habit,
  NULL::jsonb                AS nutrition,
  NULL::jsonb                AS sleep,
  NULL::int                  AS minutes,
  np.created_at              AS created_at
FROM public.nutrition_plans np

UNION ALL
/* 2) Treino (plan = jsonb) */
SELECT
  'training'::text           AS type,
  tp.id::uuid                AS id,
  tp.user_id::uuid           AS owner_id,
  tp.title::text             AS title,
  tp.plan::jsonb             AS plan,
  NULL::int                  AS day_index,
  NULL::text                 AS focus,
  NULL::jsonb                AS workout,
  NULL::jsonb                AS habit,
  NULL::jsonb                AS nutrition,
  NULL::jsonb                AS sleep,
  NULL::int                  AS minutes,
  tp.created_at              AS created_at
FROM public.training_plans tp

UNION ALL
/* 3) Dias do plano (herdam owner do plano "pai") */
SELECT
  'days'::text               AS type,
  d.id::uuid                 AS id,
  p.user_id::uuid            AS owner_id,
  ('Day ' || d.day_index)::text AS title,
  p.plan::jsonb              AS plan,            -- herda a estrutura do plano pai
  d.day_index::int           AS day_index,
  d.focus::text              AS focus,
  d.workout::jsonb           AS workout,
  d.habit::jsonb             AS habit,
  d.nutrition::jsonb         AS nutrition,
  d.sleep::jsonb             AS sleep,
  d.minutes::int             AS minutes,
  d.created_at               AS created_at
FROM public.plan_days d
JOIN public.plans p ON p.id = d.plan_id

UNION ALL
/* 4) Planos "gerais" (oferta/assinatura) */
SELECT
  'general'::text            AS type,
  p.id::uuid                 AS id,
  p.user_id::uuid            AS owner_id,
  p.title::text              AS title,
  p.plan::jsonb              AS plan,
  NULL::int                  AS day_index,
  NULL::text                 AS focus,
  NULL::jsonb                AS workout,
  NULL::jsonb                AS habit,
  NULL::jsonb                AS nutrition,
  NULL::jsonb                AS sleep,
  NULL::int                  AS minutes,
  p.created_at               AS created_at
FROM public.plans p;

-- 2.2 Views de compatibilidade (mantém rotas antigas funcionando)
CREATE OR REPLACE VIEW public.public_plans AS SELECT * FROM public.public_app_plans;

-- Se existir community_posts, criar view de comunidade
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts' AND table_schema = 'public') THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.public_community AS SELECT * FROM public.community_posts';
  END IF;
END $$;

-- Se existir rewards, criar view de recompensas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards' AND table_schema = 'public') THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.public_rewards AS SELECT * FROM public.rewards';
  END IF;
END $$;

-- 2.3 Grants mínimos (evitar "permission denied")
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Views específicas
GRANT SELECT ON public.public_app_plans TO authenticated;
GRANT SELECT ON public.public_plans TO authenticated;

-- Views condicionais (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'public_community' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT ON public.public_community TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'public_rewards' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT ON public.public_rewards TO authenticated';
  END IF;
END $$;

-- Futuro: qualquer tabela/view nova já nasce com SELECT para authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO authenticated;