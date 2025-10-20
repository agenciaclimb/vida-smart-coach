-- Enforce daily uniqueness for quick action names to prevent fraud
-- This creates a partial unique index for the four known quick actions.
-- Safe to apply multiple times (IF NOT EXISTS usage is limited for indexes; we guard by naming convention).

-- Known quick action names used in the UI
-- 'Check-in de treino', 'Meta de água', 'Check-in de humor', 'Reflexão diária'

-- Drop existing index if needed (idempotent pattern)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'uniq_quick_actions_per_day'
      AND n.nspname = 'public'
  ) THEN
    -- Keep existing; do nothing to avoid breaking clients
    NULL;
  ELSE
    EXECUTE $$
      CREATE UNIQUE INDEX uniq_quick_actions_per_day
      ON public.daily_activities (user_id, activity_date, activity_name)
      WHERE activity_name IN (
        'Check-in de treino',
        'Meta de água',
        'Check-in de humor',
        'Reflexão diária'
      )
    $$;
  END IF;
END$$;

COMMENT ON INDEX public.uniq_quick_actions_per_day IS 'Guarantees one quick action per day per user for defined quick actions.';
