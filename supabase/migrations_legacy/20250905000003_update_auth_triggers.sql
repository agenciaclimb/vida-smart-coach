-- Ensure required extensions
create extension if not exists "pg_net" with schema extensions;

create extension if not exists "supabase_vault" with schema vault;

-- Remove old trigger and helper function if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new auth users (wrapped to avoid missing function during initial setup)
DO $$
BEGIN
  BEGIN
    EXECUTE $f$
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.on_auth_user_created();
    $f$;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'on_auth_user_created function not yet available; trigger will be created later.';
  END;
END;
$$;

-- Sync updates from auth.users to profile (downstream triggers handled in later migrations)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

DO $$
BEGIN
  BEGIN
    EXECUTE $f$
      CREATE TRIGGER on_auth_user_updated
      AFTER UPDATE OF email, phone, raw_user_meta_data, last_sign_in_at ON auth.users
      FOR EACH ROW
      WHEN (OLD.* IS DISTINCT FROM NEW.*)
      EXECUTE FUNCTION public.sync_profile_from_auth();
    $f$;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'sync_profile_from_auth function not yet available; trigger will be created later.';
  END;
END;
$$;
