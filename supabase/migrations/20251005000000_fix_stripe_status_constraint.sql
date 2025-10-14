-- Correcao para PR #55: Garante que a constraint na tabela user_profiles para stripe_subscription_status existe e inclui o status 'paused'.
-- Esta migracao e idempotente.

-- Remove a constraint se ela existir, para evitar erros em re-execucoes
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_stripe_subscription_status;

-- Adiciona a constraint com a lista completa e correta de status do Stripe
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_stripe_subscription_status
CHECK (stripe_subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'));
