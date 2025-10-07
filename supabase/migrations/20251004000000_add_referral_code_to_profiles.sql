ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add a unique constraint to ensure codes are unique, which is crucial for a referral system.
-- A simple text column without a unique constraint could lead to duplicate codes.
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_referral_code_key UNIQUE (referral_code);