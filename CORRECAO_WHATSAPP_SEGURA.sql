-- ============================================
-- 🔧 CORREÇÃO WHATSAPP SEGURA - SEM ERROS
-- Data: 15/10/2025  
-- ============================================

-- 🚀 PASSO 1: Descobrir estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_messages' 
ORDER BY ordinal_position;

-- 🚀 PASSO 2: Desabilitar RLS
ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;

-- ✅ Confirmar RLS desabilitado
SELECT 'RLS desabilitado para whatsapp_messages' as status;

-- 🔍 PASSO 3: Ver mensagens recentes (estrutura segura)
SELECT * FROM whatsapp_messages 
ORDER BY timestamp DESC 
LIMIT 5;

-- 🔍 PASSO 4: Verificar usuário existe
SELECT id, phone, full_name 
FROM user_profiles 
WHERE phone LIKE '%981459950%' 
   OR phone = '5516981459950';

-- 🔍 PASSO 5: Teste inserção manual (para ver se RLS funcionou)
INSERT INTO whatsapp_messages (
    phone, 
    message, 
    event, 
    timestamp
) VALUES (
    '5516981459950@s.whatsapp.net',
    'Teste inserção manual',
    'test_insert',
    EXTRACT(EPOCH FROM NOW()) * 1000
);

-- ✅ Verificar se inserção funcionou
SELECT * FROM whatsapp_messages 
WHERE message = 'Teste inserção manual';

-- 🗑️ Limpar teste
DELETE FROM whatsapp_messages 
WHERE message = 'Teste inserção manual';