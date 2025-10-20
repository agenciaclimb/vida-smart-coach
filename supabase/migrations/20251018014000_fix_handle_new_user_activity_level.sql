-- Adjust handle_new_user to populate activity_level/referral_code and harden mission generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
  v_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_activity TEXT := COALESCE(NEW.raw_user_meta_data->>'activity_level', 'moderate');
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    phone,
    name,
    role,
    activity_level,
    referral_code,
    created_at,
    updated_at,
    billing_status,
    trial_started_at,
    trial_expires_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    v_name,
    v_role,
    v_activity,
    gen_random_uuid()::text,
    NOW(),
    NOW(),
    'trialing',
    NOW(),
    NOW() + interval '7 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    name = EXCLUDED.name,
    activity_level = COALESCE(EXCLUDED.activity_level, user_profiles.activity_level),
    referral_code = COALESCE(EXCLUDED.referral_code, user_profiles.referral_code),
    updated_at = NOW();

  BEGIN
    PERFORM public.generate_daily_missions_for_user(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'generate_daily_missions_for_user failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user()
  IS 'Creates user profile, initializes billing fields and enqueues daily missions for new auth users.';
