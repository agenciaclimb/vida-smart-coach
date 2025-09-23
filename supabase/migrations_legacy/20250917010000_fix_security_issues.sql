-- Migração: Correção de problemas de segurança (idempotente)
-- Data: 17/09/2025

-- =====================================================
-- 1. Views reconstruídas de forma resiliente
-- =====================================================

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'community_posts'
    );
    has_user BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'user_id'
    );
    has_updated BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'updated_at'
    );
    has_likes BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'likes_count'
    );
    has_comments BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'comments_count'
    );
    has_published BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'is_published'
    );
    view_sql TEXT;
BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.community_feed';
    IF NOT has_table THEN
        RAISE NOTICE 'Skipping community_feed view: base table community_posts missing.';
        RETURN;
    END IF;

    view_sql := 'CREATE VIEW public.community_feed AS SELECT id';

    IF has_user THEN
        view_sql := view_sql || ', user_id';
    ELSE
        view_sql := view_sql || ', NULL::uuid AS user_id';
    END IF;

    view_sql := view_sql || ', content, created_at';

    IF has_updated THEN
        view_sql := view_sql || ', updated_at';
    ELSE
        view_sql := view_sql || ', created_at AS updated_at';
    END IF;

    IF has_likes THEN
        view_sql := view_sql || ', likes_count';
    ELSE
        view_sql := view_sql || ', 0::integer AS likes_count';
    END IF;

    IF has_comments THEN
        view_sql := view_sql || ', comments_count';
    ELSE
        view_sql := view_sql || ', 0::integer AS comments_count';
    END IF;

    IF has_published THEN
        view_sql := view_sql || ' FROM community_posts WHERE is_published = true ORDER BY created_at DESC';
    ELSE
        view_sql := view_sql || ' FROM community_posts ORDER BY created_at DESC';
    END IF;

    EXECUTE view_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'subscription_plans'
    );
    has_features BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'features'
    );
    has_created BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'created_at'
    );
    has_active BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'is_active'
    );
    view_sql TEXT;
BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.app_plans';
    IF NOT has_table THEN
        RAISE NOTICE 'Skipping app_plans view: base table subscription_plans missing.';
        RETURN;
    END IF;

    view_sql := 'CREATE VIEW public.app_plans AS SELECT id, name, description, price';

    IF has_features THEN
        view_sql := view_sql || ', features';
    ELSE
        view_sql := view_sql || ', NULL::jsonb AS features';
    END IF;

    view_sql := view_sql || ', is_active';

    IF has_created THEN
        view_sql := view_sql || ', created_at';
    ELSE
        view_sql := view_sql || ', NOW() AS created_at';
    END IF;

    IF has_active THEN
        IF has_active THEN
        view_sql := view_sql || ' FROM subscription_plans WHERE is_active = true ORDER BY price ASC';
    ELSE
        view_sql := view_sql || ' FROM subscription_plans ORDER BY price ASC';
    END IF;
    ELSE
        view_sql := view_sql || ' FROM subscription_plans ORDER BY price ASC';
    END IF;

    EXECUTE view_sql;
END;
$$;

DO $$
DECLARE
    has_comments_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'comments'
    );
    has_profiles_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    );
    profiles_has_user_id BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_id'
    );
    profiles_has_id BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'id'
    );
    comments_has_is_deleted BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'is_deleted'
    );
    join_clause TEXT;
    filter_clause TEXT;
    view_sql TEXT;
BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.comentarios';
    IF NOT has_comments_table THEN
        RAISE NOTICE 'Skipping comentarios view: base table comments missing.';
        RETURN;
    END IF;

    IF has_profiles_table THEN
        IF profiles_has_user_id THEN
            join_clause := 'LEFT JOIN user_profiles u ON c.user_id = u.user_id';
        ELSIF profiles_has_id THEN
            join_clause := 'LEFT JOIN user_profiles u ON c.user_id = u.id';
        ELSE
            join_clause := 'LEFT JOIN user_profiles u ON FALSE';
        END IF;
    ELSE
        join_clause := 'LEFT JOIN user_profiles u ON FALSE';
    END IF;

    IF comments_has_is_deleted THEN
        filter_clause := 'WHERE COALESCE(c.is_deleted, false) = false';
    ELSE
        filter_clause := 'WHERE TRUE';
    END IF;

    view_sql := 'CREATE VIEW public.comentarios AS SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.name AS user_name FROM comments c '
        || join_clause || ' ' || filter_clause || ' ORDER BY c.created_at DESC';

    EXECUTE view_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'rewards'
    );
    has_id BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'id'
    );
    has_name BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'name'
    );
    has_description BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'description'
    );
    has_points BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'points_required'
    );
    has_category BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'category'
    );
    has_available BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'is_available'
    );
    has_created BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'created_at'
    );
    view_sql TEXT;
    order_expression TEXT;
BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.recompensas';
    IF NOT has_table THEN
        RAISE NOTICE 'Skipping recompensas view: base table rewards missing.';
        RETURN;
    END IF;

    view_sql := 'CREATE VIEW public.recompensas AS SELECT ';
    order_expression := 'id ASC';

    IF has_id THEN
        view_sql := view_sql || 'id';
    ELSE
        view_sql := view_sql || 'NULL::uuid AS id';
    END IF;

    IF has_name THEN
        view_sql := view_sql || ', name';
    ELSE
        view_sql := view_sql || ', NULL::text AS name';
    END IF;

    IF has_description THEN
        view_sql := view_sql || ', description';
    ELSE
        view_sql := view_sql || ', NULL::text AS description';
    END IF;

    IF has_points THEN
        view_sql := view_sql || ', points_required';
        order_expression := 'points_required ASC';
    ELSE
        view_sql := view_sql || ', NULL::numeric AS points_required';
    END IF;

    IF has_category THEN
        view_sql := view_sql || ', category';
    ELSE
        view_sql := view_sql || ', NULL::text AS category';
    END IF;

    IF has_available THEN
        view_sql := view_sql || ', is_available';
    ELSE
        view_sql := view_sql || ', TRUE AS is_available';
    END IF;

    IF has_created THEN
        view_sql := view_sql || ', created_at';
    ELSE
        view_sql := view_sql || ', NOW() AS created_at';
    END IF;

    IF has_available THEN
        view_sql := view_sql || ' FROM rewards WHERE is_available = true';
    ELSE
        view_sql := view_sql || ' FROM rewards';
    END IF;

    IF order_expression IS NULL THEN
        order_expression := '1';
    END IF;

    view_sql := view_sql || ' ORDER BY ' || order_expression;

    EXECUTE view_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'planos_antigos'
    );
    has_id BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'planos_antigos' AND column_name = 'id'
    );
    has_nome BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'planos_antigos' AND column_name = 'nome'
    );
    has_preco BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'planos_antigos' AND column_name = 'preco'
    );
    has_descricao BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'planos_antigos' AND column_name = 'descricao'
    );
    has_ativo BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'planos_antigos' AND column_name = 'ativo'
    );
    has_created BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'planos_antigos' AND column_name = 'created_at'
    );
    view_sql TEXT;
BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.planos_old';
    IF NOT has_table THEN
        RAISE NOTICE 'Skipping planos_old view: base table planos_antigos missing.';
        RETURN;
    END IF;

    view_sql := 'CREATE VIEW public.planos_old AS SELECT ';

    IF has_id THEN
        view_sql := view_sql || 'id';
    ELSE
        view_sql := view_sql || 'NULL::uuid AS id';
    END IF;

    IF has_nome THEN
        view_sql := view_sql || ', nome';
    ELSE
        view_sql := view_sql || ', NULL::text AS nome';
    END IF;

    IF has_preco THEN
        view_sql := view_sql || ', preco';
    ELSE
        view_sql := view_sql || ', NULL::numeric AS preco';
    END IF;

    IF has_descricao THEN
        view_sql := view_sql || ', descricao';
    ELSE
        view_sql := view_sql || ', NULL::text AS descricao';
    END IF;

    IF has_ativo THEN
        view_sql := view_sql || ', ativo';
    ELSE
        view_sql := view_sql || ', TRUE AS ativo';
    END IF;

    IF has_created THEN
        view_sql := view_sql || ', created_at';
    ELSE
        view_sql := view_sql || ', NOW() AS created_at';
    END IF;

    IF has_ativo THEN
        view_sql := view_sql || ' FROM planos_antigos WHERE ativo = true';
    ELSE
        view_sql := view_sql || ' FROM planos_antigos';
    END IF;

    EXECUTE view_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'subscription_plans'
    );
    has_updated BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'updated_at'
    );
    has_active BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'is_active'
    );
    view_sql TEXT;
BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.planos';
    IF NOT has_table THEN
        RAISE NOTICE 'Skipping planos view: base table subscription_plans missing.';
        RETURN;
    END IF;

    view_sql := 'CREATE VIEW public.planos AS SELECT id, name, price, description, features, is_active, created_at';

    IF has_updated THEN
        view_sql := view_sql || ', updated_at';
    ELSE
        view_sql := view_sql || ', created_at AS updated_at';
    END IF;

    IF has_active THEN
        IF has_active THEN
        view_sql := view_sql || ' FROM subscription_plans WHERE is_active = true ORDER BY price ASC';
    ELSE
        view_sql := view_sql || ' FROM subscription_plans ORDER BY price ASC';
    END IF;
    ELSE
        view_sql := view_sql || ' FROM subscription_plans ORDER BY price ASC';
    END IF;

    EXECUTE view_sql;
END;
$$;

-- =====================================================
-- 2. RLS em tabelas sensíveis
-- =====================================================

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'error_logs'
    );
    has_policy BOOLEAN := EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'error_logs' AND policyname = 'error_logs_admin_only'
    );
    has_role BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
    );
    policy_sql TEXT;
BEGIN
    IF NOT has_table THEN
        RAISE NOTICE 'Skipping RLS setup for error_logs: table not found.';
        RETURN;
    END IF;

    EXECUTE 'ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY';

    IF has_policy THEN
        RETURN;
    END IF;

    IF has_role THEN
        policy_sql := 'CREATE POLICY "error_logs_admin_only" ON public.error_logs FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin''))';
    ELSE
        policy_sql := 'CREATE POLICY "error_logs_admin_only" ON public.error_logs FOR ALL USING (auth.uid() IS NOT NULL)';
    END IF;

    EXECUTE policy_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'supabase_migrations'
    );
    has_policy BOOLEAN := EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'supabase_migrations' AND policyname = 'migrations_admin_only'
    );
    has_role BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
    );
    policy_sql TEXT;
BEGIN
    IF NOT has_table THEN
        RAISE NOTICE 'Skipping RLS setup for supabase_migrations: table not found.';
        RETURN;
    END IF;

    EXECUTE 'ALTER TABLE public.supabase_migrations ENABLE ROW LEVEL SECURITY';

    IF has_policy THEN
        RETURN;
    END IF;

    IF has_role THEN
        policy_sql := 'CREATE POLICY "migrations_admin_only" ON public.supabase_migrations FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin''))';
    ELSE
        policy_sql := 'CREATE POLICY "migrations_admin_only" ON public.supabase_migrations FOR ALL USING (auth.uid() IS NOT NULL)';
    END IF;

    EXECUTE policy_sql;
END;
$$;

-- =====================================================
-- 3. Políticas adicionais para tabelas base
-- =====================================================

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'community_posts'
    );
    has_policy BOOLEAN := EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'community_posts_public_read'
    );
    has_flag BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'is_published'
    );
    policy_sql TEXT;
BEGIN
    IF NOT has_table OR has_policy THEN
        RETURN;
    END IF;

    IF has_flag THEN
        policy_sql := 'CREATE POLICY "community_posts_public_read" ON public.community_posts FOR SELECT USING (COALESCE(is_published, false) = true)';
    ELSE
        policy_sql := 'CREATE POLICY "community_posts_public_read" ON public.community_posts FOR SELECT USING (TRUE)';
    END IF;

    EXECUTE policy_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'subscription_plans'
    );
    has_policy BOOLEAN := EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'subscription_plans' AND policyname = 'subscription_plans_public_read'
    );
    has_flag BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'is_active'
    );
    policy_sql TEXT;
BEGIN
    IF NOT has_table OR has_policy THEN
        RETURN;
    END IF;

    IF has_flag THEN
        policy_sql := 'CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans FOR SELECT USING (COALESCE(is_active, true) = true)';
    ELSE
        policy_sql := 'CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans FOR SELECT USING (TRUE)';
    END IF;

    EXECUTE policy_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'comments'
    );
    has_policy BOOLEAN := EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_public_read'
    );
    has_flag BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'is_deleted'
    );
    policy_sql TEXT;
BEGIN
    IF NOT has_table OR has_policy THEN
        RETURN;
    END IF;

    IF has_flag THEN
        policy_sql := 'CREATE POLICY "comments_public_read" ON public.comments FOR SELECT USING (COALESCE(is_deleted, false) = false)';
    ELSE
        policy_sql := 'CREATE POLICY "comments_public_read" ON public.comments FOR SELECT USING (TRUE)';
    END IF;

    EXECUTE policy_sql;
END;
$$;

DO $$
DECLARE
    has_table BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'rewards'
    );
    has_policy BOOLEAN := EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'rewards' AND policyname = 'rewards_public_read'
    );
    has_flag BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'is_available'
    );
    policy_sql TEXT;
BEGIN
    IF NOT has_table OR has_policy THEN
        RETURN;
    END IF;

    IF has_flag THEN
        policy_sql := 'CREATE POLICY "rewards_public_read" ON public.rewards FOR SELECT USING (COALESCE(is_available, true) = true)';
    ELSE
        policy_sql := 'CREATE POLICY "rewards_public_read" ON public.rewards FOR SELECT USING (TRUE)';
    END IF;

    EXECUTE policy_sql;
END;
$$;

-- =====================================================
-- 4. RLS garantido para tabelas adicionais
-- =====================================================

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('user_profiles', 'daily_checkins', 'user_achievements',
                            'referrals', 'payments', 'subscriptions', 'user_sessions')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.tablename);
        RAISE NOTICE 'RLS habilitado para tabela: %', rec.tablename;
    END LOOP;
END;
$$;

-- =====================================================
-- 5. Limpeza
-- =====================================================

DROP VIEW IF EXISTS public.old_community_feed;

DROP VIEW IF EXISTS public.legacy_plans;

DROP VIEW IF EXISTS public.temp_view;

-- =====================================================
-- 6. Atualização de estatísticas (se tabelas existirem)
-- =====================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('user_profiles', 'subscription_plans', 'community_posts', 'comments', 'rewards')
    LOOP
        EXECUTE format('ANALYZE public.%I', tbl.tablename);
    END LOOP;
END;
$$;

-- =====================================================
-- 7. Comentários nas views
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'community_feed') THEN
        EXECUTE 'COMMENT ON VIEW public.community_feed IS ''View segura para exibir posts da comunidade publicados''';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'app_plans') THEN
        EXECUTE 'COMMENT ON VIEW public.app_plans IS ''View segura para exibir planos ativos da aplicação''';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'comentarios') THEN
        EXECUTE 'COMMENT ON VIEW public.comentarios IS ''View segura para exibir comentários não deletados''';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'recompensas') THEN
        EXECUTE 'COMMENT ON VIEW public.recompensas IS ''View segura para exibir recompensas disponíveis''';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'planos') THEN
        EXECUTE 'COMMENT ON VIEW public.planos IS ''View segura para exibir planos de assinatura ativos''';
    END IF;
END;
$$;

-- =====================================================
-- 8. Log opcional
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'migration_logs'
    ) THEN
        INSERT INTO public.migration_logs (migration_name, executed_at, description)
        VALUES (
            '20250917010000_fix_security_issues',
            NOW(),
            'Correção de problemas de segurança: Views sem security definer e reforço de RLS'
        )
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'Tabela migration_logs ausente; log não registrado.';
    END IF;
END;
$$;
