-- Normalizar telefones existentes na tabela whatsapp_messages
-- Remove @s.whatsapp.net e outros sufixos para consistência

UPDATE public.whatsapp_messages
SET phone = REGEXP_REPLACE(phone, '@s\.whatsapp\.net$', '')
WHERE phone LIKE '%@s.whatsapp.net';

-- Verificar resultado
SELECT 
    COUNT(*) as total_messages,
    COUNT(DISTINCT phone) as unique_phones,
    array_agg(DISTINCT phone) as phone_samples
FROM public.whatsapp_messages
LIMIT 10;
