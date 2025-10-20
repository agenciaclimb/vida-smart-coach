-- ============================================
-- 🚨 CORREÇÃO URGENTE WHATSAPP - EXECUTAR NO SQL EDITOR
-- Data: 15/10/2025
-- Problema: IA parou de responder no WhatsApp
-- ============================================

-- 🚀 CORREÇÃO #1: Desabilitar RLS temporariamente (PRINCIPAL SUSPEITO)
ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;

-- ✅ Verificar se funcionou
SELECT 'RLS desabilitado para whatsapp_messages' as status;

-- 🔍 DIAGNÓSTICO #1: Verificar se usuário existe no banco
SELECT 
    id, 
    phone, 
    full_name,
    created_at 
FROM user_profiles 
WHERE phone LIKE '%981459950%' 
   OR phone LIKE '%16981459950%'
   OR phone = '5516981459950';

-- 🔍 DIAGNÓSTICO #2: Verificar mensagens WhatsApp recentes
SELECT 
    id,
    phone,
    message,
    event,
    timestamp,
    created_at
FROM whatsapp_messages 
ORDER BY timestamp DESC 
LIMIT 10;

-- 🔍 DIAGNÓSTICO #3: Verificar se há estágios de cliente
SELECT 
    id,
    user_id,
    current_stage,
    updated_at
FROM client_stages 
ORDER BY updated_at DESC 
LIMIT 5;

-- 🔍 DIAGNÓSTICO #4: Verificar últimas interações
SELECT 
    id,
    user_id,
    stage,
    content,
    ai_response,
    created_at
FROM interactions 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- 📊 RELATÓRIO DE STATUS
-- ============================================

-- Contar total de usuários
SELECT COUNT(*) as total_users FROM user_profiles;

-- Contar mensagens WhatsApp hoje
SELECT COUNT(*) as messages_today 
FROM whatsapp_messages 
WHERE created_at >= CURRENT_DATE;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'whatsapp_messages';

-- ============================================
-- 🎯 APÓS EXECUTAR ESTE SQL:
-- 1. Enviar mensagem teste no WhatsApp
-- 2. Verificar se aparece nova linha em whatsapp_messages
-- 3. Monitorar logs Edge Functions em tempo real
-- 4. Confirmar se IA responde
-- ============================================