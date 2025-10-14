-- Idempotent guard to ensure canonical auth triggers stay in place
create extension if not exists "pg_net" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

DO $
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'sync_profile_from_auth'
  ) THEN
    CREATE TRIGGER on_auth_user_updated
      AFTER UPDATE OF email, phone, raw_user_meta_data, last_sign_in_at ON auth.users
      FOR EACH ROW
      WHEN (OLD.* IS DISTINCT FROM NEW.*)
      EXECUTE FUNCTION public.sync_profile_from_auth();
  ELSE
    RAISE NOTICE 'Function public.sync_profile_from_auth() not found, skipping trigger on_auth_user_updated creation.';
  END IF;
END;
$;