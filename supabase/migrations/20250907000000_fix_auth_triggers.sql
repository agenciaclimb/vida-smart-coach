-- Garantias básicas (idempotente)
create extension if not exists "pg_net" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;

-- Recreate helpers to ensure they exist even if previous migration failed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fallback_email    TEXT := COALESCE(NEW.email, 'user_' || NEW.id::text || '@temp.local');
  fallback_name     TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
  fallback_role     TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  fallback_activity TEXT := COALESCE(NEW.raw_user_meta_data->>'activity_level', 'moderate');
BEGIN
  INSERT INTO public.user_profiles (
    id,
    name,
    email,
    activity_level,
    role,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    fallback_name,
    fallback_email,
    fallback_activity,
    fallback_role,
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, user_profiles.name),
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    activity_level = COALESCE(EXCLUDED.activity_level, user_profiles.activity_level),
    role = COALESCE(EXCLUDED.role, user_profiles.role),
    onboarding_completed = COALESCE(EXCLUDED.onboarding_completed, user_profiles.onboarding_completed),
    updated_at = NOW();

  INSERT INTO public.gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

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

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.sync_profile_from_auth() TO supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

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
