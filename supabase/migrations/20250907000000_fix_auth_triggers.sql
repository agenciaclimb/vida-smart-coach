-- Garantias básicas (idempotente)
create extension if not exists "pg_net" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'handle_new_user'
      AND p.prorettype = 'pg_catalog.trigger'::regtype
  ) THEN
    RAISE EXCEPTION 'Function public.handle_new_user() must exist before running 20250907000000_fix_auth_triggers';
  END IF;
END;
$$;

-- 2. Conectar o AFTER INSERT de auth.users -> public.handle_new_user()
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 3. Sincronizar updates essenciais do auth.users -> profiles
create trigger on_auth_user_updated
after update of email, phone, raw_user_meta_data, last_sign_in_at on auth.users
for each row
when (old.* is distinct from new.*)
execute function public.sync_profile_from_auth();
