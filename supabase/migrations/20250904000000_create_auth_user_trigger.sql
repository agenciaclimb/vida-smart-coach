
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    COALESCE(NEW.email, 'user' || NEW.id || '@temp.local'),
    'moderate',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, user_profiles.name),
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
  users_owner text;
BEGIN
  -- Check who owns auth.users
  SELECT tableowner INTO users_owner
  FROM pg_tables
  WHERE schemaname = 'auth' AND tablename = 'users';

  IF users_owner = current_user THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create user profile after auth user creation';
    
    RAISE NOTICE 'Auth trigger created (owner: %)', users_owner;
  ELSE
    RAISE NOTICE 'Skipping auth.users trigger DDL (owner: %, current_user: %)', users_owner, current_user;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user is created in auth.users';
