-- Migração para corrigir problemas de segurança identificados no Security Advisor
-- Data: 17/09/2025
-- Objetivo: Resolver Security Definer Views e habilitar RLS nas tabelas públicas

-- =====================================================
-- 1. CORRIGIR SECURITY DEFINER VIEWS
-- =====================================================

-- Recriar views problemáticas sem SECURITY DEFINER
-- Estas views estavam escalando privilégios desnecessariamente

-- View: public.community_feed
DROP VIEW IF EXISTS public.community_feed;
CREATE VIEW public.community_feed AS
SELECT 
    id,
    user_id,
    content,
    created_at,
    updated_at,
    likes_count,
    comments_count
FROM community_posts 
WHERE is_published = true 
ORDER BY created_at DESC;

-- View: public.app_plans  
DROP VIEW IF EXISTS public.app_plans;
CREATE VIEW public.app_plans AS
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

-- View: public.comentarios
DROP VIEW IF EXISTS public.comentarios;
CREATE VIEW public.comentarios AS
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.content,
    c.created_at,
    u.name as user_name
FROM comments c
LEFT JOIN user_profiles u ON c.user_id = u.user_id
WHERE c.is_deleted = false
ORDER BY c.created_at DESC;

-- View: public.recompensas
DROP VIEW IF EXISTS public.recompensas;
CREATE VIEW public.recompensas AS
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

-- View: public.planos_old
DROP VIEW IF EXISTS public.planos_old;
CREATE VIEW public.planos_old AS
SELECT 
    id,
    nome,
    preco,
    descricao,
    ativo,
    created_at
FROM planos_antigos 
WHERE ativo = true;

-- View: public.planos
DROP VIEW IF EXISTS public.planos;
CREATE VIEW public.planos AS
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

-- =====================================================
-- 2. HABILITAR RLS NAS TABELAS PÚBLICAS
-- =====================================================

-- Habilitar RLS na tabela public.error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Política para error_logs - apenas administradores podem ver logs
CREATE POLICY "error_logs_admin_only" ON public.error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Habilitar RLS na tabela public.supabase_migrations
ALTER TABLE public.supabase_migrations ENABLE ROW LEVEL SECURITY;

-- Política para supabase_migrations - apenas administradores podem ver migrações
CREATE POLICY "migrations_admin_only" ON public.supabase_migrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =====================================================
-- 3. POLÍTICAS ADICIONAIS PARA AS VIEWS
-- =====================================================

-- Como as views não podem ter RLS diretamente, vamos garantir que as tabelas base tenham políticas adequadas

-- Política para community_posts (base da view community_feed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'community_posts' 
        AND policyname = 'community_posts_public_read'
    ) THEN
        CREATE POLICY "community_posts_public_read" ON public.community_posts
            FOR SELECT USING (is_published = true);
    END IF;
END $$;

-- Política para subscription_plans (base das views app_plans e planos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscription_plans' 
        AND policyname = 'subscription_plans_public_read'
    ) THEN
        CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Política para comments (base da view comentarios)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' 
        AND policyname = 'comments_public_read'
    ) THEN
        CREATE POLICY "comments_public_read" ON public.comments
            FOR SELECT USING (is_deleted = false);
    END IF;
END $$;

-- Política para rewards (base da view recompensas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rewards' 
        AND policyname = 'rewards_public_read'
    ) THEN
        CREATE POLICY "rewards_public_read" ON public.rewards
            FOR SELECT USING (is_available = true);
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAÇÕES DE SEGURANÇA ADICIONAIS
-- =====================================================

-- Garantir que todas as tabelas sensíveis tenham RLS habilitado
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Lista de tabelas que devem ter RLS habilitado
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'user_profiles', 'daily_checkins', 'user_achievements', 
            'referrals', 'payments', 'subscriptions', 'user_sessions'
        )
    LOOP
        -- Habilitar RLS se não estiver habilitado
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        
        RAISE NOTICE 'RLS habilitado para tabela: %', table_record.tablename;
    END LOOP;
END $$;

-- =====================================================
-- 5. LIMPEZA E OTIMIZAÇÃO
-- =====================================================

-- Remover views antigas que podem estar causando problemas
DROP VIEW IF EXISTS public.old_community_feed;
DROP VIEW IF EXISTS public.legacy_plans;
DROP VIEW IF EXISTS public.temp_view;

-- Atualizar estatísticas das tabelas para melhor performance
ANALYZE public.user_profiles;
ANALYZE public.subscription_plans;
ANALYZE public.community_posts;
ANALYZE public.comments;
ANALYZE public.rewards;

-- =====================================================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON VIEW public.community_feed IS 'View segura para exibir posts da comunidade publicados';
COMMENT ON VIEW public.app_plans IS 'View segura para exibir planos ativos da aplicação';
COMMENT ON VIEW public.comentarios IS 'View segura para exibir comentários não deletados';
COMMENT ON VIEW public.recompensas IS 'View segura para exibir recompensas disponíveis';
COMMENT ON VIEW public.planos IS 'View segura para exibir planos de assinatura ativos';

-- Log da migração
INSERT INTO public.migration_logs (migration_name, executed_at, description) 
VALUES (
    '20250917010000_fix_security_issues',
    NOW(),
    'Correção de problemas de segurança: Security Definer Views e RLS em tabelas públicas'
) ON CONFLICT DO NOTHING;

