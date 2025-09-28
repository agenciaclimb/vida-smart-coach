-- ===============================================
-- 🔍 CONSULTAS SQL - DIAGNÓSTICO VIDA SMART
-- ===============================================
-- Execute no SQL Editor do Supabase
-- Projeto: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql

-- ===============================================
-- 1️⃣ VERIFICAR SE USUÁRIO EXISTE
-- ===============================================
-- Substitua 'seu_email@exemplo.com' pelo email de teste
SELECT 
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
WHERE email ILIKE 'seu_email@exemplo.com%'  -- ← TROCAR AQUI
ORDER BY created_at DESC 
LIMIT 5;

-- ===============================================
-- 2️⃣ VERIFICAR SESSÕES RECENTES DO USUÁRIO  
-- ===============================================
-- Substitua 'seu_email@exemplo.com' pelo email de teste
SELECT 
    s.id as session_id,
    s.user_id,
    u.email,
    s.created_at as session_created,
    s.updated_at as session_updated,
    s.not_after as session_expires,
    s.refreshed_at,
    CASE 
        WHEN s.not_after > NOW() THEN '✅ Válida'
        ELSE '❌ Expirada'
    END as status
FROM auth.sessions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email ILIKE 'seu_email@exemplo.com'  -- ← TROCAR AQUI
ORDER BY s.created_at DESC 
LIMIT 10;

-- ===============================================
-- 3️⃣ VERIFICAR CONFIGURAÇÕES DE JWT
-- ===============================================
-- Mostrar configurações atuais de JWT
SELECT 
    'jwt_exp' as setting,
    COALESCE(
        (SELECT value FROM auth.config WHERE parameter = 'jwt_exp'),
        '3600'
    ) as value,
    'Tempo de expiração do JWT em segundos' as description
UNION ALL
SELECT 
    'refresh_token_rotation_enabled' as setting,
    COALESCE(
        (SELECT value FROM auth.config WHERE parameter = 'refresh_token_rotation_enabled'),
        'true'
    ) as value,
    'Se refresh tokens são rotacionados' as description;

-- ===============================================
-- 4️⃣ ÚLTIMAS TENTATIVAS DE LOGIN (AUDITORIA)
-- ===============================================
-- Verificar tentativas de auth recentes
SELECT 
    created_at,
    level,
    msg,
    metadata
FROM auth.audit_log_entries
WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND msg ILIKE '%sign%'
ORDER BY created_at DESC
LIMIT 20;

-- ===============================================
-- 5️⃣ VERIFICAR RLS DAS TABELAS PRINCIPAIS
-- ===============================================
-- Verificar se as políticas RLS estão corretas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('comunidade', 'planos', 'recompensas', 'profiles')
ORDER BY tablename, policyname;

-- ===============================================
-- 6️⃣ TESTAR PERMISSÕES DE SELECT (SIMULAR APP)
-- ===============================================
-- Estas queries devem funcionar se RLS estiver OK
-- Execute apenas se tiver dados de teste nas tabelas

-- Teste comunidade
SELECT 'comunidade' as tabela, COUNT(*) as registros
FROM comunidade;

-- Teste planos  
SELECT 'planos' as tabela, COUNT(*) as registros
FROM planos;

-- Teste recompensas
SELECT 'recompensas' as tabela, COUNT(*) as registros  
FROM recompensas;

-- ===============================================
-- 7️⃣ DIAGNÓSTICO DE PROBLEMAS COMUNS
-- ===============================================

-- Verificar se há usuários duplicados
SELECT 
    email,
    COUNT(*) as quantidade
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- Verificar sessões órfãs (sem usuário)
SELECT 
    COUNT(*) as sessoes_orfas
FROM auth.sessions s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- Verificar usuários sem sessão recente (últimos 7 dias)
SELECT 
    u.email,
    u.created_at as usuario_criado,
    u.last_sign_in_at as ultimo_login,
    COALESCE(MAX(s.created_at), 'Nunca') as ultima_sessao
FROM auth.users u
LEFT JOIN auth.sessions s ON u.id = s.user_id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at
ORDER BY u.created_at DESC;

-- ===============================================
-- 📋 INTERPRETAÇÃO DOS RESULTADOS
-- ===============================================

/*
QUERY 1 - Usuário existe?
✅ Se retornar dados: usuário foi criado corretamente
❌ Se vazio: problema no registro/login

QUERY 2 - Sessões do usuário:
✅ Se mostrar sessões válidas: auth funcionando
❌ Se todas expiradas: problema de JWT expiry
❌ Se vazio: sessão não sendo criada

QUERY 3 - Configurações JWT:
✅ jwt_exp deve ser >= 3600 (1 hora)
✅ refresh_token_rotation_enabled = true

QUERY 4 - Auditoria:
🔍 Procurar por erros de signin
🔍 Mensagens de "expired" ou "invalid"

QUERY 5 - RLS Policies:
✅ Deve ter policies para SELECT nas tabelas
❌ Se vazio: tabelas sem proteção RLS

QUERY 6 - Teste de SELECT:
✅ Se retornar dados: RLS OK para usuário auth
❌ Se erro: problema de permissão RLS

QUERY 7 - Diagnósticos:
🔍 Identificar dados inconsistentes
🔍 Sessões órfãs ou usuários sem login
*/