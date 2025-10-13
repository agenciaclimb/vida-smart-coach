-- Migration: ensure user_profiles.name is populated
-- Date: 2025-10-11

CREATE OR REPLACE FUNCTION public.ensure_user_profile_name()
RETURNS trigger AS $$
BEGIN
  NEW.name := COALESCE(NULLIF(NEW.name, ''), NULLIF(NEW.full_name, ''), NEW.email, 'Usuario');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS user_profiles_ensure_name ON user_profiles;
CREATE TRIGGER user_profiles_ensure_name
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile_name();

UPDATE user_profiles
SET name = COALESCE(NULLIF(name, ''), NULLIF(full_name, ''), email, 'Usuario')
WHERE name IS NULL OR name = '';

ALTER TABLE user_profiles
  ALTER COLUMN name SET NOT NULL;
