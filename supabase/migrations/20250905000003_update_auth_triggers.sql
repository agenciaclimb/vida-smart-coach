-- Ensure required extensions
create extension if not exists "pg_net" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;

-- Remove old trigger and helper function if present
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
     SET email = COALESCE(NEW.email, user_profiles.email),
         name = COALESCE(NEW.raw_user_meta_data->>'full_name', user_profiles.name),
         role = COALESCE(NEW.raw_user_meta_data->>'role', user_profiles.role),
         activity_level = COALESCE(NEW.raw_user_meta_data->>'activity_level', user_profiles.activity_level),
         updated_at = NOW()
   WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in sync_profile_from_auth trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create trigger for new auth users


-- Sync updates from auth.users to profile
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, phone, raw_user_meta_data, last_sign_in_at ON auth.users
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.sync_profile_from_auth();

