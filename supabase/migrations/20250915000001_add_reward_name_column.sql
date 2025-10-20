-- Add name column to rewards for backwards compatibility
-- Date: 2025-09-15

ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS name TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'rewards'
       AND column_name = 'title'
  ) THEN
    EXECUTE $SQL$
      UPDATE public.rewards
         SET name = COALESCE(name, title)
       WHERE name IS NULL
    $SQL$;
  ELSE
    RAISE NOTICE 'Column public.rewards.title not found; skipping backfill.';
  END IF;
END;
$$;

COMMENT ON COLUMN public.rewards.name IS 'Alias for reward title to support normalized views.';
