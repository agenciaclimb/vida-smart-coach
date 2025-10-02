-- Fix auth trigger creation (idempotent)
-- Date: 2025-10-01
-- Purpose: Ensure handle_new_user trigger function exists and is applied safely

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fallback_email TEXT := COALESCE(NEW.email, 'user_' || NEW.id::text || '@temp.local');
  fallback_name  TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
  fallback_role  TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
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
    activity_level = COALESCE(user_profiles.activity_level, EXCLUDED.activity_level),
    role = COALESCE(user_profiles.role, EXCLUDED.role),
    onboarding_completed = COALESCE(user_profiles.onboarding_completed, EXCLUDED.onboarding_completed),
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

-- Keep profile information in sync when sensitive auth fields are updated
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
     SET email = COALESCE(NEW.email, user_profiles.email),
         name = COALESCE(NEW.raw_user_meta_data->>'full_name', user_profiles.name),
         role = COALESCE(EXCLUDED.role, user_profiles.role),
         activity_level = COALESCE(EXCLUDED.activity_level, user_profiles.activity_level),
         updated_at = NOW()
   WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in sync_profile_from_auth trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;
GRANT ALL ON public.gamification TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.sync_profile_from_auth() TO supabase_auth_admin;

DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    BEGIN
      EXECUTE 'DROP TRIGGER on_auth_user_created ON auth.users';
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to drop trigger on auth.users';
    END;
  END IF;

  BEGIN
    EXECUTE 'CREATE TRIGGER on_auth_user_created
             AFTER INSERT ON auth.users
             FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Insufficient privileges to create trigger on auth.users';
  END;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_profiles'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.user_profiles
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and gamification record when new user registers.';


