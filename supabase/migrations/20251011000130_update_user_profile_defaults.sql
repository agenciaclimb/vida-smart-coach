-- Migration: extend ensure_user_profile_name defaults
-- Date: 2025-10-11

CREATE OR REPLACE FUNCTION public.ensure_user_profile_name()
RETURNS trigger AS $$
BEGIN
  NEW.email := COALESCE(NULLIF(NEW.email, ''), NULLIF(NEW.full_name, ''), NULLIF(NEW.name, ''), 'sem-email@temp.local');
  NEW.full_name := COALESCE(NULLIF(NEW.full_name, ''), NULLIF(NEW.name, ''), NEW.email, 'Usuario');
  NEW.name := COALESCE(NULLIF(NEW.name, ''), NEW.full_name, NEW.email, 'Usuario');
  NEW.activity_level := COALESCE(NULLIF(NEW.activity_level, ''), 'moderate');
  NEW.role := COALESCE(NULLIF(NEW.role, ''), 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
