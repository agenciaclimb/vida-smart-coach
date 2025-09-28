-- Fix auth trigger creation (idempotent)
-- Date: 2025-09-28
-- Purpose: Ensure function exists before trigger and recreate trigger safely

-- Ensure the trigger function is properly set up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_phone TEXT;
BEGIN
  -- Extract phone from metadata
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'phone',
    NULL
  );

  -- Create user profile
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
$$;

-- Ensure proper permissions for the function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;
GRANT ALL ON public.gamification TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Idempotent trigger creation
DO $$
DECLARE 
  trg_exists boolean;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created' 
    AND n.nspname = 'auth' 
    AND c.relname = 'users'
  ) INTO trg_exists;

  -- Drop trigger if it exists
  IF trg_exists THEN
    EXECUTE 'DROP TRIGGER on_auth_user_created ON auth.users';
    RAISE NOTICE 'Existing trigger dropped';
  END IF;

  -- Create the trigger (function must exist first)
  EXECUTE 'CREATE TRIGGER on_auth_user_created
           AFTER INSERT ON auth.users
           FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';
           
  RAISE NOTICE 'Trigger on_auth_user_created created successfully';
END $$;

-- Add function comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and gamification record when new user registers. Idempotent and safe.';