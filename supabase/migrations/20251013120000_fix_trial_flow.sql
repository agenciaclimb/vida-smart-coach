-- 1. Corrigir o ENUM para os tipos de notificação de trial
ALTER TYPE public.trial_notification_type RENAME TO trial_notification_type_old;
CREATE TYPE public.trial_notification_type AS ENUM ('trial_expiring_3_days', 'trial_expiring_1_day', 'trial_expired_today');
ALTER TABLE public.trial_notifications ALTER COLUMN notification_type TYPE public.trial_notification_type USING notification_type::text::public.trial_notification_type;
DROP TYPE public.trial_notification_type_old;

COMMENT ON TYPE public.trial_notification_type IS 'Tipos de notificação para o período de trial, alinhados com a Edge Function.';

-- 2. Atualizar a função handle_new_user para a versão mais recente e completa
-- Esta versão garante que o trial seja configurado E as missões iniciais sejam geradas.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere ou atualiza o perfil do usuário
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
    -- Colunas de Billing
    billing_status,
    trial_started_at,
    trial_expires_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'activity_level', 'moderate'),
    gen_random_uuid()::text,
    NOW(),
    NOW(),
    -- Valores de Billing
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

  -- FIX: Gera as missões diárias iniciais para o novo usuário.
  PERFORM public.generate_daily_missions_for_user(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que o trigger esteja usando a função atualizada.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
