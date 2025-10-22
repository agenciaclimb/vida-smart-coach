-- Script para resetar histórico de conversa do usuário e simular cliente novo
-- Usuário: Jeferson Costa (45ba22ad-c44d-4825-a6e9-1658becdb7b4)

BEGIN;

-- 1. Limpar mensagens WhatsApp
DELETE FROM public.whatsapp_messages
WHERE phone = '5516981459950';

-- 2. Limpar estágios do cliente (vai criar novo em SDR)
DELETE FROM public.client_stages
WHERE user_id = '45ba22ad-c44d-4825-a6e9-1658becdb7b4';

-- 3. Limpar interações antigas
DELETE FROM public.interactions
WHERE user_id = '45ba22ad-c44d-4825-a6e9-1658becdb7b4';

-- 4. Verificar reset
SELECT 
    'whatsapp_messages' as tabela,
    COUNT(*) as registros_restantes
FROM public.whatsapp_messages
WHERE phone = '5516981459950'

UNION ALL

SELECT 
    'client_stages' as tabela,
    COUNT(*) as registros_restantes
FROM public.client_stages
WHERE user_id = '45ba22ad-c44d-4825-a6e9-1658becdb7b4'

UNION ALL

SELECT 
    'interactions' as tabela,
    COUNT(*) as registros_restantes
FROM public.interactions
WHERE user_id = '45ba22ad-c44d-4825-a6e9-1658becdb7b4';

COMMIT;

-- Resultado esperado: todos com 0 registros_restantes
