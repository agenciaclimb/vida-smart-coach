
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
    NEW.email,
    'moderate',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user is created in auth.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create user profile after auth user creation';
