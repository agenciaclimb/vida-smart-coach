-- Habilita as extensões necessárias se ainda não estiverem ativas.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Garante que a extensão vault está disponível
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Tenta remover o job antigo, ignorando o erro se ele não existir.
DO $$
BEGIN
    PERFORM cron.unschedule('trial-reminder-job');
EXCEPTION
    WHEN OTHERS THEN
        -- Ignora o erro se o job não existir
END;
$$;

-- Agenda a função para ser executada todos os dias à 1h UTC.
SELECT cron.schedule(
    'trial-reminder-job', -- Mantendo o mesmo nome, mas com tratamento de erro
    '0 1 * * *', -- Todos os dias à 1h da manhã UTC
    $$
    SELECT net.http_post(
        url := 'https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/trial-reminder',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_FUNCTION_SECRET' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);
