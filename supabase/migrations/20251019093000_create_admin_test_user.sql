-- Ensure extensions required for deterministic UUID generation and password hashing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--
-- Provisiona um usuario administrador de teste para verificacao manual do dashboard.
-- Email: admin.qa@vida-smart.local
-- Senha: AdminTest123! (hash gerado com bcrypt via pgcrypto)
-- IMPORTANTE: Substitua credenciais por valores seguros antes de qualquer deploy de producao.
--
DO $$
DECLARE
  v_email CONSTANT text := 'admin.qa@vida-smart.local';
  v_default_password CONSTANT text := 'AdminTest123!';
  v_user_id uuid;
BEGIN
  -- Recupera o ID existente, se o usuario ja tiver sido criado anteriormente
  SELECT id INTO v_user_id
    FROM auth.users
   WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := uuid_generate_v5(uuid_ns_url(), v_email);

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_token,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      email_change_sent_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_default_password, gen_salt('bf')),
      now(),
      '',
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'Administrador QA'),
      now(),
      now(),
      '',
      '',
      '',
      '',
      NULL
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Garante que exista um perfil sincronizado e com a role de administrador
  IF EXISTS (
    SELECT 1
      FROM pg_proc
     WHERE proname = 'safe_upsert_user_profile'
       AND pg_function_is_visible(oid)
  ) THEN
    PERFORM public.safe_upsert_user_profile(
      v_user_id,
      'Administrador QA',
      'Admin QA',
      v_email,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      'sedentary',
      NULL
    );
  ELSE
    INSERT INTO public.user_profiles AS up (
      id,
      full_name,
      name,
      email,
      role,
      activity_level,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      'Administrador QA',
      'Admin QA',
      v_email,
      'admin',
      'sedentary',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          updated_at = now();
  END IF;

  UPDATE public.user_profiles
     SET role = 'admin',
         updated_at = now()
   WHERE id = v_user_id;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'user_profiles'
       AND column_name = 'onboarding_completed'
  ) THEN
    UPDATE public.user_profiles
       SET onboarding_completed = TRUE,
           updated_at = now()
     WHERE id = v_user_id;
  END IF;

  -- Gera missoes de gamificacao somente se a funcao existir
  IF EXISTS (
    SELECT 1
      FROM pg_proc
     WHERE proname = 'generate_daily_missions_for_user'
       AND pg_function_is_visible(oid)
  ) THEN
    PERFORM public.generate_daily_missions_for_user(v_user_id);
  END IF;
END;
$$;
