
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
    
    RAISE NOTICE 'Auth trigger dropped for gamification setup (owner: %)', users_owner;
  ELSE
    RAISE NOTICE 'Skipping auth.users trigger DDL for gamification (owner: %, current_user: %)', users_owner, current_user;
  END IF;
END
$$;

DROP FUNCTION IF EXISTS public.create_gamification_for_user();

CREATE OR REPLACE FUNCTION public.create_gamification_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.gamification (user_id, points, level, streak_days, total_checkins, badges)
  VALUES (NEW.id, 0, 1, 0, 0, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  
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
    CREATE TRIGGER on_auth_user_created_gamification
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.create_gamification_for_user();
    
    COMMENT ON TRIGGER on_auth_user_created_gamification ON auth.users IS 'Trigger to create gamification record after auth user creation';
    
    RAISE NOTICE 'Gamification trigger created (owner: %)', users_owner;
  ELSE
    RAISE NOTICE 'Skipping gamification trigger creation (owner: %, current_user: %)', users_owner, current_user;
  END IF;
END
$$;

GRANT EXECUTE ON FUNCTION public.create_gamification_for_user() TO supabase_auth_admin;

COMMENT ON FUNCTION public.create_gamification_for_user() IS 'Creates gamification record for new users with duplicate handling';
