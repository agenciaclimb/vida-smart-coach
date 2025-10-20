-- Align gamification schema with strategic system expectations
-- Date: 2025-10-20

ALTER TABLE public.gamification
  ADD COLUMN IF NOT EXISTS checkins_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actions_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrals_made INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.gamification
  ALTER COLUMN checkins_completed SET DEFAULT 0,
  ALTER COLUMN actions_completed SET DEFAULT 0,
  ALTER COLUMN referrals_made SET DEFAULT 0;

UPDATE public.gamification
SET checkins_completed = COALESCE(checkins_completed, 0),
    actions_completed = COALESCE(actions_completed, 0),
    referrals_made = COALESCE(referrals_made, 0),
    created_at = COALESCE(created_at, NOW());

ALTER TABLE public.gamification
  ALTER COLUMN checkins_completed SET NOT NULL,
  ALTER COLUMN actions_completed SET NOT NULL,
  ALTER COLUMN referrals_made SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.gamification
  ALTER COLUMN updated_at SET DEFAULT NOW();

UPDATE public.gamification
SET updated_at = COALESCE(updated_at, NOW());
