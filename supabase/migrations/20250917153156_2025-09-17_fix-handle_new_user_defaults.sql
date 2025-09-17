CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, name, full_name, email, activity_level, role, created_at, updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.email, 'user' || substr(NEW.id::text,1,8) || '@temp.local'),
    COALESCE(NEW.raw_user_meta_data->>'activity_level', 'moderate'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, user_profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    updated_at = NOW();

  INSERT INTO public.gamification (user_id, level, xp, coins, streak, created_at, updated_at)
  VALUES (NEW.id, 1, 0, 0, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
