-- supabase/migrations/20251014181600_create_admin_user.sql

-- Inserir um usuário de teste com credenciais seguras no sistema de autenticação
-- IMPORTANTE: A senha é 'admin_password_placeholder'. Em um ambiente real,
-- isso deve ser trocado imediatamente ou gerenciado via segredos.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'authenticated', 'authenticated', 'admin@vidasmartcoach.com', crypt('admin_password_placeholder', gen_salt('bf')), NOW(), '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir o perfil correspondente para o usuário administrador, definindo sua role como 'admin'
INSERT INTO public.user_profiles (id, name, email, role, activity_level)
VALUES
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Administrador', 'admin@vidasmartcoach.com', 'admin', 'sedentary')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

