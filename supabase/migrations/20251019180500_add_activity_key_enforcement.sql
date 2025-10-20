-- Add activity_key column to support canonical identifiers for daily activities
ALTER TABLE public.daily_activities
  ADD COLUMN IF NOT EXISTS activity_key text;

-- Backfill known quick actions with deterministic keys
UPDATE public.daily_activities
SET activity_key = CASE activity_name
  WHEN 'Check-in de treino' THEN 'quick-checkin-treino'
  WHEN 'Meta de água' THEN 'quick-meta-agua'
  WHEN 'Check-in de humor' THEN 'quick-checkin-humor'
  WHEN 'Reflexão diária' THEN 'quick-reflexao-diaria'
  ELSE activity_key
END
WHERE activity_key IS NULL
  AND activity_name IN (
    'Check-in de treino',
    'Meta de água',
    'Check-in de humor',
    'Reflexão diária'
  );

-- Remove duplicate quick actions to allow unique index creation (keeps the most recent record)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, activity_date, activity_key
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.daily_activities
  WHERE activity_key IS NOT NULL
)
DELETE FROM public.daily_activities da
USING ranked r
WHERE da.id = r.id
  AND r.rn > 1;

-- Drop legacy partial index if it exists; the new key-based index supersedes it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'uniq_quick_actions_per_day'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP INDEX public.uniq_quick_actions_per_day';
  END IF;
END$$;

-- Enforce uniqueness per user/day/key (ignores legacy rows without key)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_daily_activity_key_per_day
  ON public.daily_activities (user_id, activity_date, activity_key)
  WHERE activity_key IS NOT NULL;

COMMENT ON COLUMN public.daily_activities.activity_key IS
  'Normalized identifier for activity uniqueness (e.g. quick-checkin-treino, mission-<id>).';

COMMENT ON INDEX public.uniq_daily_activity_key_per_day IS
  'Prevents duplicate activities per user/day when activity_key is provided.';


-- Fallback uniqueness for legacy rows without activity_key using known quick action names
CREATE UNIQUE INDEX IF NOT EXISTS uniq_daily_activity_name_per_day
  ON public.daily_activities (user_id, activity_date, activity_name)
  WHERE activity_key IS NULL
    AND activity_name IN (
      'Check-in de treino',
      'Meta de água',
      'Check-in de humor',
      'Reflexão diária'
    );

