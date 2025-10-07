-- Add name column to rewards for backwards compatibility
-- Date: 2025-09-15

ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE public.rewards
   SET name = COALESCE(name, title)
 WHERE name IS NULL;

COMMENT ON COLUMN public.rewards.name IS 'Alias for reward title to support normalized views.';
