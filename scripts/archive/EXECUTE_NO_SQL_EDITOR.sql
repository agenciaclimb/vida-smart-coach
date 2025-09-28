-- =====================================================
-- CORREÇÕES DE SEGURANÇA - VIDA SMART COACH
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. HABILITAR RLS NAS TABELAS PÚBLICAS
-- =====================================================

-- Habilitar RLS na tabela error_logs
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela supabase_migrations  
ALTER TABLE IF EXISTS public.supabase_migrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CRIAR POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Política para error_logs - apenas administradores
DROP POLICY IF EXISTS "error_logs_admin_only" ON public.error_logs;
CREATE POLICY "error_logs_admin_only" ON public.error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'administrator')
        )
    );

-- Política para supabase_migrations - apenas administradores
DROP POLICY IF EXISTS "migrations_admin_only" ON public.supabase_migrations;
CREATE POLICY "migrations_admin_only" ON public.supabase_migrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'administrator')
        )
    );

-- =====================================================
-- 3. RECRIAR VIEWS SEM SECURITY DEFINER
-- =====================================================

-- View: community_feed
DROP VIEW IF EXISTS public.community_feed CASCADE;
CREATE OR REPLACE VIEW public.community_feed AS
SELECT 
    id,
    user_id,
    content,
    created_at,
    updated_at,
    COALESCE(likes_count, 0) as likes_count,
    COALESCE(comments_count, 0) as comments_count
FROM community_posts 
WHERE is_published = true 
ORDER BY created_at DESC;

-- View: app_plans
DROP VIEW IF EXISTS public.app_plans CASCADE;
CREATE OR REPLACE VIEW public.app_plans AS
SELECT 
    id,
    name,
    description,
    price,
    features,
    is_active,
    created_at
FROM subscription_plans 
WHERE is_active = true 
ORDER BY price ASC;

-- View: comentarios
DROP VIEW IF EXISTS public.comentarios CASCADE;
CREATE OR REPLACE VIEW public.comentarios AS
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.content,
    c.created_at,
    COALESCE(u.name, 'Usuário') as user_name
FROM comments c
LEFT JOIN user_profiles u ON c.user_id = u.user_id
WHERE c.is_deleted = false
ORDER BY c.created_at DESC;

-- View: recompensas
DROP VIEW IF EXISTS public.recompensas CASCADE;
CREATE OR REPLACE VIEW public.recompensas AS
SELECT 
    id,
    name,
    description,
    points_required,
    category,
    is_available,
    created_at
FROM rewards 
WHERE is_available = true 
ORDER BY points_required ASC;

-- View: planos
DROP VIEW IF EXISTS public.planos CASCADE;
CREATE OR REPLACE VIEW public.planos AS
SELECT 
    id,
    name,
    price,
    description,
    features,
    is_active,
    created_at,
    updated_at
FROM subscription_plans 
WHERE is_active = true 
ORDER BY price ASC;

-- View: planos_old (se existir)
DROP VIEW IF EXISTS public.planos_old CASCADE;

-- =====================================================
-- 4. GARANTIR RLS EM OUTRAS TABELAS SENSÍVEIS
-- =====================================================

-- Lista de tabelas que devem ter RLS habilitado
DO $$
DECLARE
    table_name text;
    tables_to_secure text[] := ARRAY[
        'user_profiles', 'daily_checkins', 'user_achievements', 
        'referrals', 'payments', 'subscriptions', 'user_sessions',
        'community_posts', 'comments', 'rewards'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_secure
    LOOP
        -- Verificar se a tabela existe antes de habilitar RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = table_name) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'RLS habilitado para: %', table_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 5. LIMPEZA E COMENTÁRIOS
-- =====================================================

-- Remover views antigas que podem causar problemas
DROP VIEW IF EXISTS public.old_community_feed CASCADE;
DROP VIEW IF EXISTS public.legacy_plans CASCADE;
DROP VIEW IF EXISTS public.temp_view CASCADE;

-- Adicionar comentários às views
COMMENT ON VIEW public.community_feed IS 'View segura para posts da comunidade (sem SECURITY DEFINER)';
COMMENT ON VIEW public.app_plans IS 'View segura para planos da aplicação (sem SECURITY DEFINER)';
COMMENT ON VIEW public.comentarios IS 'View segura para comentários (sem SECURITY DEFINER)';
COMMENT ON VIEW public.recompensas IS 'View segura para recompensas (sem SECURITY DEFINER)';
COMMENT ON VIEW public.planos IS 'View segura para planos (sem SECURITY DEFINER)';

-- =====================================================
-- 6. VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar tabelas com RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Mostrar views criadas
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ CORREÇÕES DE SEGURANÇA APLICADAS COM SUCESSO!';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Acesse Advisors > Security Advisor';
    RAISE NOTICE '2. Clique em Refresh';
    RAISE NOTICE '3. Verifique se os erros foram resolvidos';
END $$;

