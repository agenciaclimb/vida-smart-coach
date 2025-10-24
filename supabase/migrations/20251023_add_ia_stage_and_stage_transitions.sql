-- Migration: Add ia_stage to user_profiles and stage_transitions audit table
-- Created at: 2025-10-23

-- 1) Enum for stages (idempotent-lean via check)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'ia_stage_type'
  ) THEN
    CREATE TYPE ia_stage_type AS ENUM ('sdr','specialist','seller','partner');
  END IF;
END $$;

-- 2) Add columns to user_profiles if not exists
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS ia_stage ia_stage_type NOT NULL DEFAULT 'sdr',
  ADD COLUMN IF NOT EXISTS stage_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3) stage_transitions audit table
CREATE TABLE IF NOT EXISTS public.stage_transitions (
  id BIGSERIAL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  from_stage ia_stage_type,
  to_stage ia_stage_type NOT NULL,
  reason text,
  signals jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) RLS policies (enable if table exists)
ALTER TABLE public.stage_transitions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "service_all_stage_transitions" ON public.stage_transitions;
CREATE POLICY "service_all_stage_transitions"
  ON public.stage_transitions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own transitions
DROP POLICY IF EXISTS "users_read_own_stage_transitions" ON public.stage_transitions;
CREATE POLICY "users_read_own_stage_transitions"
  ON public.stage_transitions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure default value applied to existing rows
UPDATE public.user_profiles SET ia_stage = 'sdr' WHERE ia_stage IS NULL;
UPDATE public.user_profiles SET stage_metadata = '{}'::jsonb WHERE stage_metadata IS NULL;
