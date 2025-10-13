-- Migration: Add a user_id column to user_profiles for compatibility
-- Date: 2025-09-16
-- Reason: The view in 20250917010000_fix_security_issues.sql incorrectly joins on user_id.

-- Add a user_id column for compatibility with a broken view creation
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS user_id UUID;

-- Populate the new column from the existing id column
UPDATE public.user_profiles SET user_id = id WHERE user_id IS NULL;

-- Create a trigger to keep it in sync
CREATE OR REPLACE FUNCTION sync_user_id_for_profiles()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_user_id_trigger ON public.user_profiles;

CREATE TRIGGER sync_user_id_trigger
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_id_for_profiles();
