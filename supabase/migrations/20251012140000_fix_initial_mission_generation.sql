
-- fix: Gera missões diárias para novos usuários na criação da conta
-- Corrige o bug onde novos usuários (especialmente via OAuth) não tinham missões diárias
-- geradas, resultando em um erro 403 ao acessar o endpoint /rest/v1/daily_missions.
-- A função handle_new_user agora invoca generate_daily_missions_for_user
-- garantindo que as missões existam desde o início.

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
    referral_token,
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
    updated_at = NOW();

  -- FIX: Gera as missões diárias iniciais para o novo usuário.
  -- Esta chamada estava faltando, causando o bug de acesso (403).
  PERFORM public.generate_daily_missions_for_user(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o trigger para garantir que a nova versão da função seja usada.
-- O trigger original está em 20250904000000_create_auth_user_trigger.sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
