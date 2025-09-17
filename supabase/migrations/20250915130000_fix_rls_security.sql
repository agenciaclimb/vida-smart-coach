-- Migration: Fix RLS Security Issues
-- Date: 2025-09-15
-- Purpose: Enable RLS on public tables and fix security definer views

DO $$
DECLARE
  rec RECORD;
  policy_sql TEXT;
  comment_sql TEXT;
BEGIN
  FOR rec IN
    SELECT rel_name, enable_rls, policies, comments
    FROM (
      SELECT
        'community_feed'::TEXT AS rel_name,
        TRUE AS enable_rls,
        ARRAY[
          'CREATE POLICY ""Users can view community feed"" ON public.community_feed FOR SELECT USING (true)',
          'CREATE POLICY ""Users can insert to community feed"" ON public.community_feed FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
        ]::TEXT[] AS policies,
        ARRAY[
          'COMMENT ON POLICY ""Users can view community feed"" ON public.community_feed IS ''Allow all users to view community feed posts'''
        ]::TEXT[] AS comments

      UNION ALL

      SELECT
        'app_plans'::TEXT,
        TRUE,
        ARRAY[
          'CREATE POLICY ""Users can view app plans"" ON public.app_plans FOR SELECT USING (true)'
        ]::TEXT[],
        ARRAY[
          'COMMENT ON POLICY ""Users can view app plans"" ON public.app_plans IS ''Allow all users to view available app plans'''
        ]::TEXT[]

      UNION ALL

      SELECT
        'comentfade'::TEXT,
        TRUE,
        ARRAY[
          'CREATE POLICY ""Users can view comments"" ON public.comentfade FOR SELECT USING (true)',
          'CREATE POLICY ""Users can insert comments"" ON public.comentfade FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
        ]::TEXT[],
        NULL::TEXT[]

      UNION ALL

      SELECT
        'recompensas'::TEXT,
        TRUE,
        ARRAY[
          'CREATE POLICY ""Users can view rewards"" ON public.recompensas FOR SELECT USING (true)'
        ]::TEXT[],
        NULL::TEXT[]

      UNION ALL

      SELECT
        'planos_old'::TEXT,
        TRUE,
        ARRAY[
          'CREATE POLICY ""Users can view old plans"" ON public.planos_old FOR SELECT USING (true)'
        ]::TEXT[],
        NULL::TEXT[]

      UNION ALL

      SELECT
        'planos'::TEXT,
        TRUE,
        ARRAY[
          'CREATE POLICY ""Users can view plans"" ON public.planos FOR SELECT USING (true)'
        ]::TEXT[],
        NULL::TEXT[]

      UNION ALL

      SELECT
        'error_logs'::TEXT,
        TRUE,
        ARRAY[
          'CREATE POLICY ""Only admins can view error logs"" ON public.error_logs FOR SELECT USING ((SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ''admin'') IS NOT NULL)',
          'CREATE POLICY ""System can insert error logs"" ON public.error_logs FOR INSERT WITH CHECK (true)'
        ]::TEXT[],
        ARRAY[
          'COMMENT ON POLICY ""Only admins can view error logs"" ON public.error_logs IS ''Restrict error log access to admin users only'''
        ]::TEXT[]
    ) AS policy_data
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = rec.rel_name
        AND c.relkind IN ('r','p')
    ) THEN
      IF rec.enable_rls THEN
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.rel_name);
      END IF;
      IF rec.policies IS NOT NULL THEN
        FOREACH policy_sql IN ARRAY rec.policies LOOP
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = rec.rel_name
              AND policyname = split_part(policy_sql, '"', 3)
          ) THEN
            EXECUTE policy_sql;
          END IF;
        END LOOP;
      END IF;
      IF rec.comments IS NOT NULL THEN
        FOREACH comment_sql IN ARRAY rec.comments LOOP
          EXECUTE comment_sql;
        END LOOP;
      END IF;
    ELSE
      RAISE NOTICE 'Skipping RLS setup for %: relation not found or not a table.', rec.rel_name;
    END IF;
  END LOOP;
END;
$$;

-- Note: Security-definer views are handled in later migrations (see 20250917010000_fix_security_issues.sql)
