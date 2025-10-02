-- Add missing columns required by auth trigger helpers
-- Date: 2025-09-05

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.user_profiles.email IS 'User email address mirrored from auth.users';
COMMENT ON COLUMN public.user_profiles.onboarding_completed IS 'Whether the user completed onboarding.';
