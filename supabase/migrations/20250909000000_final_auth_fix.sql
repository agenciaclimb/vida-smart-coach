-- Final fix for authentication and user profile creation
-- Date: 2025-09-09
-- Purpose: Ensure user_profiles table has correct constraints and trigger

-- First, ensure the trigger function is properly set up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_phone TEXT;
BEGIN
  -- Extract phone from metadata
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'phone',
    NULL
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
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
  
  -- Create gamification record if it doesn't exist
  INSERT INTO public.gamification (
    user_id,
    level,
    xp,
    coins,
    streak,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    1,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper permissions for the function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;
GRANT ALL ON public.gamification TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Service role policy for system operations
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

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and gamification record when new user registers';

-- Ensure trigger is created only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
