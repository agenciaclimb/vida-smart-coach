-- supabase/migrations/20251014182000_create_admin_user.sql

--
-- PASSO 1: Inserir o usuário de teste na tabela auth.users
--
-- IMPORTANTE:
-- O UUID do usuário é gerado deterministicamente a partir do email.
-- A senha é 'admin12345'. O hash foi gerado usando o próprio Supabase.
-- Substitua os placeholders se necessário, mas NUNCA com credenciais reais em produção.
--
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
  uuid_generate_v5(uuid_ns_url(), 'admin@example.com'), -- UUID determinístico
  'authenticated',
  'authenticated',
  'admin@example.com',
  '$2a$10$5Jj.h/w4C5x/B6a8E.8xX.2Q/l6./bKk9.Y.CV7z5x1f.A/I.d/mK', -- Hash para 'admin12345'
  NOW(),
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;

--
-- PASSO 2: Inserir o perfil correspondente na tabela public.user_profiles
--
-- O UUID do usuário DEVE ser o mesmo gerado no PASSO 1.
-- A role é definida como 'admin'.
--
INSERT INTO public.user_profiles (
  id,
  name,
  email,
  role,
  activity_level,
  region,
  spirituality
)
VALUES (
  uuid_generate_v5(uuid_ns_url(), 'admin@example.com'), -- Mesmo UUID
  'Administrador',
  'admin@example.com',
  'admin', -- A role de administrador
  'sedentary',
  'sudeste',
  'agnostico'
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name;

--
-- PASSO 3: Gerar missões iniciais para o usuário admin
--
-- Garante que o dashboard do admin não quebre por falta de dados de gamificação.
--
SELECT public.generate_daily_missions_for_user(uuid_generate_v5(uuid_ns_url(), 'admin@example.com'));

