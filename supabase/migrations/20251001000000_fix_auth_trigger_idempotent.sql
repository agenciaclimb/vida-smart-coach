-- Fix auth trigger creation (idempotent)
-- Date: 2025-10-01
-- Purpose: Ensure handle_new_user trigger function exists and is applied safely

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_phone TEXT;
BEGIN
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.user_profiles (
    id,
    name,
    email,
    activity_level,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.email, 'user' || substr(NEW.id::text, 1, 8) || '@temp.local'),
    'moderate',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, user_profiles.name),
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    updated_at = NOW();

  INSERT INTO public.gamification (user_id, total_points, current_level, streak_days)
  VALUES (NEW.id, 0, 1, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;
GRANT ALL ON public.gamification TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

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
