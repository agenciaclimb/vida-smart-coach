
CREATE OR REPLACE FUNCTION public.set_safe_search_path()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    PERFORM set_config('search_path', 'public, auth', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_safe_search_path() TO service_role;

CREATE OR REPLACE FUNCTION public.validate_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = table_name AND n.nspname = 'public';
    
    RETURN COALESCE(rls_enabled, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_rls_enabled(text) TO service_role;

DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.secure_db_operation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
BEGIN
    NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.secure_db_operation() TO service_role;
