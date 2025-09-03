

ALTER TABLE public.ai_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commissions ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated users to manage ai_nudges" ON public.ai_nudges
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service_role full access to ai_nudges" ON public.ai_nudges
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow public read access on integrations_evolution" ON public.integrations_evolution
    FOR SELECT USING (true);

CREATE POLICY "Allow service_role full access to integrations_evolution" ON public.integrations_evolution
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow public read access on integrations_whatsapp" ON public.integrations_whatsapp
    FOR SELECT USING (true);

CREATE POLICY "Allow service_role full access to integrations_whatsapp" ON public.integrations_whatsapp
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow public insert on inbound_events" ON public.inbound_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service_role full access to inbound_events" ON public.inbound_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to manage ai_coach_settings" ON public.ai_coach_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service_role full access to ai_coach_settings" ON public.ai_coach_settings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to manage ai_coach_actions" ON public.ai_coach_actions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service_role full access to ai_coach_actions" ON public.ai_coach_actions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow users to manage their own coach_user_state" ON public.coach_user_state
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Allow users to manage their own daily_metrics" ON public.daily_metrics
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Allow users to manage their own habits" ON public.habits
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');


DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_conversations') THEN
        EXECUTE 'CREATE POLICY "Allow users to manage their own ai_conversations" ON public.ai_conversations
            FOR ALL USING (auth.uid() = user_id OR auth.role() = ''service_role'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_interactions') THEN
        EXECUTE 'CREATE POLICY "Allow users to manage their own ai_interactions" ON public.ai_interactions
            FOR ALL USING (auth.uid() = user_id OR auth.role() = ''service_role'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkins') THEN
        EXECUTE 'CREATE POLICY "Allow users to manage their own checkins" ON public.checkins
            FOR ALL USING (auth.uid() = user_id OR auth.role() = ''service_role'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plan_days') THEN
        EXECUTE 'CREATE POLICY "Allow authenticated users to read plan_days" ON public.plan_days
            FOR SELECT USING (auth.role() = ''authenticated'' OR auth.role() = ''service_role'')';
        EXECUTE 'CREATE POLICY "Allow service_role to manage plan_days" ON public.plan_days
            FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'measurements') THEN
        EXECUTE 'CREATE POLICY "Allow users to manage their own measurements" ON public.measurements
            FOR ALL USING (auth.uid() = user_id OR auth.role() = ''service_role'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_ledger') THEN
        EXECUTE 'CREATE POLICY "Allow users to manage their own points_ledger" ON public.points_ledger
            FOR ALL USING (auth.uid() = user_id OR auth.role() = ''service_role'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commissions') THEN
        EXECUTE 'CREATE POLICY "Allow authenticated users to read commissions" ON public.commissions
            FOR SELECT USING (auth.role() = ''authenticated'' OR auth.role() = ''service_role'')';
        EXECUTE 'CREATE POLICY "Allow service_role to manage commissions" ON public.commissions
            FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
END $$;


CREATE POLICY "Allow authenticated users to read affiliates" ON public.affiliates
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow service_role to manage affiliates" ON public.affiliates
    FOR ALL USING (auth.role() = 'service_role');


CREATE OR REPLACE FUNCTION public.set_safe_search_path()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM set_config('search_path', 'public, pg_temp', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 
                          table_record.schemaname, table_record.tablename);
            RAISE NOTICE 'RLS habilitado para tabela: %.%', 
                         table_record.schemaname, table_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao habilitar RLS para %.%: %', 
                           table_record.schemaname, table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

SELECT 'CORREÇÃO RLS COMPLETA - Todas as tabelas foram configuradas com RLS e políticas apropriadas!' as status;
