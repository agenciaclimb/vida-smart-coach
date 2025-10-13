

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."auth_has_access_to_resource"("req" json) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  test_action TEXT;
  test_source TEXT;
  test_resource TEXT;
  test_user_id UUID;
BEGIN
  test_action := req::json->>'action';
  test_source := req::json->>'source';
  test_resource := req::json->>'resource';
  test_user_id := (req::json->>'user_id')::uuid;

  RETURN (
    select exists (
      select 1
      from public.permissions as p
      where p.source = test_source
        and p.action = test_action
        and p.resource = test_resource
        and p.user_id = test_user_id
    )
  );
END;
$$;


ALTER FUNCTION "public"."auth_has_access_to_resource"("req" json) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Set search path to empty string for security
    SET search_path = '';
    
    -- Implement your actual logic here with fully qualified names
    -- This is just a placeholder logic
    RETURN EXISTS (
        SELECT 1 
        FROM public.resources 
        WHERE public.resources.id = resource_id
          AND public.resources.owner_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid", "permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_has_access boolean;
BEGIN
  -- Definir search_path vazio para segurança
  SET search_path = '';
  
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS (
    SELECT 1
    FROM public.users_permissions up
    WHERE up.user_id = v_user_id
    AND up.resource_id = auth_has_access_to_resource.resource_id
    AND up.permission = auth_has_access_to_resource.permission
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;


ALTER FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid", "permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_has_access_to_resource"("resource_owner" "uuid", "resource_id" "uuid", "permission_level" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Verificar se o usuário autenticado é o proprietário do recurso
    IF resource_owner = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se o recurso é público (quando permission_level é fornecido)
    IF permission_level IS NOT NULL AND permission_level = 'public' THEN
        RETURN TRUE;
    END IF;
    
    -- Por padrão, negar acesso
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."auth_has_access_to_resource"("resource_owner" "uuid", "resource_id" "uuid", "permission_level" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_bmi"("weight_kg" numeric, "height_cm" numeric) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF weight_kg IS NULL OR height_cm IS NULL OR height_cm = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND((weight_kg / POWER(height_cm / 100, 2))::DECIMAL, 1);
END;
$$;


ALTER FUNCTION "public"."calculate_bmi"("weight_kg" numeric, "height_cm" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."call_nudge_dispatcher"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://your-dispatcher-url.com/api/nudge',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.dispatcher_key', true) || '"}',
        body := '{}'
    );
END;
$$;


ALTER FUNCTION "public"."call_nudge_dispatcher"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_subscription_expiry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Check if subscription has expired
    IF NEW.expires_at < NOW() AND NEW.status = 'active' THEN
        NEW.status = 'expired';
        
        -- Update user profile to reflect expired subscription
        UPDATE public.profiles
        SET subscription_tier = 'free',
            subscription_status = 'inactive'
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_subscription_expiry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_access"("resource_id" "uuid", "required_role" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  user_role text;
BEGIN
  -- Use private helper function
  user_role := private.get_user_role();
  
  -- Compare roles (simplified example)
  RETURN user_role = required_role;
END;
$$;


ALTER FUNCTION "public"."check_user_access"("resource_id" "uuid", "required_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_gamification_for_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert gamification record with conflict handling
  INSERT INTO public.gamification (user_id, points, level, streak_days, total_checkins, badges)
  VALUES (NEW.id, 0, 1, 0, 0, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_gamification_for_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile_on_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log optional
  INSERT INTO public.error_logs(context, details)
  VALUES ('create_user_profile_on_signup', sqlerrm);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."create_user_profile_on_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_referral_token"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    chars text[] := '{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,0,1,2,3,4,5,6,7,8,9}';
    result text := '';
    i integer := 0;
    token_exists boolean;
BEGIN
    -- Generate a unique referral token if it's not provided
    IF NEW.referral_token IS NULL THEN
        LOOP
            result := '';
            FOR i IN 1..10 LOOP
                result := result || chars[1 + floor(random() * 36)];
            END LOOP;

            -- Check if token already exists
            SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_token = result) INTO token_exists;
            
            EXIT WHEN NOT token_exists;
        END LOOP;
        
        NEW.referral_token := result;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_referral_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_affiliate_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  chars text[] := '{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,0,1,2,3,4,5,6,7,8,9}';
  result text := '';
  i int;
  code_exists boolean;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || chars[1 + floor(random() * 36)];
    end loop;

    select exists(select 1 from public.affiliates where code = result) into code_exists; -- <- coluna certa
    exit when not code_exists;
  end loop;

  new.code := result;  -- <- atribui no registro antes do insert
  return new;
end;
$$;


ALTER FUNCTION "public"."generate_affiliate_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_daily_missions_for_user"("p_user_id" "uuid", "p_date" "date" DEFAULT CURRENT_DATE) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    missions_data JSONB := '[
        {"type": "easy", "category": "physical", "title": "Check-in de treino", "description": "Faça seu check-in de treino diário", "points": 10},
        {"type": "easy", "category": "nutrition", "title": "Registrar refeição", "description": "Registre pelo menos uma refeição", "points": 10},
        {"type": "easy", "category": "emotional", "title": "Check-in de humor", "description": "Registre como você está se sentindo", "points": 10},
        {"type": "medium", "category": "physical", "title": "Meta de passos", "description": "Alcance sua meta diária de passos", "points": 20},
        {"type": "medium", "category": "nutrition", "title": "Meta de água", "description": "Beba sua meta diária de água", "points": 15},
        {"type": "medium", "category": "emotional", "title": "Prática de respiração", "description": "Faça um exercício de respiração", "points": 20},
        {"type": "challenging", "title": "Treino completo", "category": "physical", "description": "Complete um treino de 30 minutos", "points": 40},
        {"type": "challenging", "title": "Alimentação perfeita", "category": "nutrition", "description": "Siga 100% do seu plano alimentar", "points": 35},
        {"type": "challenging", "title": "Meditação", "category": "emotional", "description": "Medite por pelo menos 15 minutos", "points": 30}
    ]'::JSONB;
    
    mission JSONB;
    selected_missions JSONB[];
    mission_type TEXT;
    i INTEGER;
BEGIN
    -- Delete existing missions for the date
    DELETE FROM daily_missions WHERE user_id = p_user_id AND mission_date = p_date;
    
    -- Select one mission of each type randomly
    FOR mission_type IN SELECT DISTINCT value->>'type' FROM jsonb_array_elements(missions_data)
    LOOP
        SELECT value INTO mission 
        FROM jsonb_array_elements(missions_data) 
        WHERE value->>'type' = mission_type 
        ORDER BY random() 
        LIMIT 1;
        
        INSERT INTO daily_missions (
            user_id, mission_date, mission_type, title, description, 
            category, points_reward, target_value
        ) VALUES (
            p_user_id, p_date, mission->>'type', mission->>'title', 
            mission->>'description', mission->>'category', 
            (mission->>'points')::INTEGER, '{}'::JSONB
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_daily_missions_for_user"("p_user_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_user"() RETURNS "uuid"
    LANGUAGE "sql"
    AS $$
    SELECT auth.uid();
$$;


ALTER FUNCTION "public"."get_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_user"("auth_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN (
    SELECT
      jsonb_build_object(
        'id', id,
        'email', email,
        'role', role
      )
    FROM auth.users
    WHERE id = auth_id
  );
END;
$$;


ALTER FUNCTION "public"."get_auth_user"("auth_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_partner_dashboard_data_v1"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RAISE NOTICE 'Getting partner dashboard data';
END;
$$;


ALTER FUNCTION "public"."get_partner_dashboard_data_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_partner_dashboard_data_v2"("partner_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    result json;
    commission_rate_c1 numeric := 0.10; -- Comissão Padrão Nível 1
    commission_rate_c2 numeric := 0.05; -- Comissão Padrão Nível 2
    partner_plan_name text;
BEGIN
    -- Obter o plano do parceiro para determinar a taxa de comissão
    SELECT p.plan INTO partner_plan_name FROM public.profiles p WHERE p.id = partner_user_id;

    -- (Opcional) Lógica para buscar taxas de comissão do plano do parceiro, se aplicável
    -- SELECT (features->>'referral_commission_tier1')::numeric INTO commission_rate_c1 
    -- FROM public.plans WHERE name = partner_plan_name;

    -- Construir o JSON de resultado
    SELECT json_build_object(
        'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = partner_user_id),
        'clients', (
            SELECT COALESCE(json_agg(client_data), '[]'::json)
            FROM (
                SELECT 
                    c.id, 
                    c.full_name, 
                    c.plan, 
                    c.created_at,
                    COALESCE((pl.price * commission_rate_c1), 0) as commission_value
                FROM public.profiles c
                LEFT JOIN public.plans pl ON c.plan = pl.name
                WHERE c.referred_by = partner_user_id
            ) as client_data
        ),
        'summary', (
            SELECT json_build_object(
                'total', COALESCE(SUM(amount), 0),
                'pending', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
                'paid', COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)
            ) 
            FROM public.payout_requests 
            WHERE partner_id = partner_user_id
        )
    ) INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_partner_dashboard_data_v2"("partner_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_partner_dashboard_data_v3"("partner_id" "uuid", "start_date" "date", "end_date" "date") RETURNS TABLE("date" "date", "revenue" numeric, "users" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  valid_partner boolean;
BEGIN
  -- Input validation
  IF start_date > end_date THEN
    RAISE EXCEPTION 'Invalid date range: start_date must be before or equal to end_date';
  END IF;
  
  -- Authorization check example (if needed)
  SELECT EXISTS (
    SELECT 1 FROM public.user_partners up
    WHERE up.partner_id = get_partner_dashboard_data.partner_id
    AND up.user_id = auth.uid()
  ) INTO valid_partner;
  
  IF NOT valid_partner THEN
    RAISE EXCEPTION 'Access denied: User does not have access to this partner';
  END IF;
  
  -- Use fully qualified names for all database objects
  RETURN QUERY
  SELECT 
    pd.date,
    pd.revenue,
    pd.users
  FROM 
    public.partner_data pd
  WHERE 
    pd.partner_id = get_partner_dashboard_data.partner_id
    AND pd.date BETWEEN get_partner_dashboard_data.start_date AND get_partner_dashboard_data.end_date
  ORDER BY 
    pd.date;
END;
$$;


ALTER FUNCTION "public"."get_partner_dashboard_data_v3"("partner_id" "uuid", "start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'email', email,
        'role', role
      )
    )
    FROM auth.users
  );
END;
$$;


ALTER FUNCTION "public"."get_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_subscription_access"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Add subscription access logic
    -- Note: This is a placeholder implementation as we don't know the exact logic
    -- Make sure all table references use public schema prefix
    
    -- Example: Update user profile with subscription info
    UPDATE public.profiles
    SET subscription_tier = NEW.tier,
        subscription_status = NEW.status
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."grant_subscription_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  insert into public.user_profiles (id, full_name, phone, region, spirituality)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'region',
    new.raw_user_meta_data->>'spirituality'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    phone = coalesce(excluded.phone, public.user_profiles.phone),
    region = coalesce(excluded.region, public.user_profiles.region),
    spirituality = coalesce(excluded.spirituality, public.user_profiles.spirituality),
    updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_test"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RAISE NOTICE 'Handle new user test executed';
END;
$$;


ALTER FUNCTION "public"."handle_new_user_test"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_test"("user_id" "uuid", "email" "text", "meta_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  -- Criar uma estrutura similar a um registro NEW
  new_record RECORD;
BEGIN
  -- Aqui não precisamos criar um registro NEW completo,
  -- apenas inserir diretamente nas tabelas alvo
  
  -- Inserir em profiles (se existir)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    INSERT INTO public.profiles (id, role)
    VALUES (user_id, 'client')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- Inserir em user_profiles (se existir)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    INSERT INTO public.user_profiles (user_id, name)
    VALUES (user_id, COALESCE(meta_data->>'name', email))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_test"("user_id" "uuid", "email" "text", "meta_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_redemption"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Subtract the points spent from the user's profile
    UPDATE public.profiles
    SET points = points - NEW.points_spent
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_redemption"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_stripe_webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.error_logs(context, details)
  values ('handle_stripe_webhook', coalesce(NEW.event_type, 'no type'));
  return NEW;
exception when others then
  insert into public.error_logs(context, details)
  values ('handle_stripe_webhook_error', sqlerrm);
  return NEW;
end;
$$;


ALTER FUNCTION "public"."handle_stripe_webhook"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid()
       and p.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_error"("error_message" "text", "error_details" "jsonb" DEFAULT '{}'::"jsonb", "severity" "text" DEFAULT 'error'::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    log_id bigint;
    current_user_id uuid;
BEGIN
    -- Get the current user ID if authenticated
    current_user_id := (SELECT auth.uid());
    
    -- Insert the error log
    INSERT INTO public.system_logs(
        event_type,
        details,
        user_id
    )
    VALUES (
        'error:' || severity,
        jsonb_build_object(
            'message', error_message,
            'timestamp', now(),
            'details', error_details
        ),
        current_user_id
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
EXCEPTION
    WHEN OTHERS THEN
        -- If logging itself fails, we don't want to propagate the error
        -- Just return null to indicate failure
        RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."log_error"("error_message" "text", "error_details" "jsonb", "severity" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_info"("event_name" "text", "event_details" "jsonb" DEFAULT '{}'::"jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    log_id bigint;
    current_user_id uuid;
BEGIN
    -- Get the current user ID if authenticated
    current_user_id := (SELECT auth.uid());
    
    -- Insert the info log
    INSERT INTO public.system_logs(
        event_type,
        details,
        user_id
    )
    VALUES (
        'info:' || event_name,
        jsonb_build_object(
            'timestamp', now(),
            'details', event_details
        ),
        current_user_id
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
EXCEPTION
    WHEN OTHERS THEN
        -- If logging itself fails, we don't want to propagate the error
        -- Just return null to indicate failure
        RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."log_info"("event_name" "text", "event_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_system_event"("event_type" "text", "event_data" json) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Definir search_path vazio para segurança
    SET search_path = '';
    
    INSERT INTO public.system_logs (event_type, event_data, created_at)
    VALUES (event_type, event_data, now());
END;
$$;


ALTER FUNCTION "public"."log_system_event"("event_type" "text", "event_data" json) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_system_event"("event_type" "text", "details" "jsonb", "user_id" "uuid" DEFAULT NULL::"uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    log_id bigint;
BEGIN
    -- If the user_id is not provided, use the current authenticated user
    IF user_id IS NULL THEN
        user_id := (SELECT auth.uid());
    END IF;
    
    -- Insert the log entry
    INSERT INTO public.system_logs(event_type, details, user_id)
    VALUES (event_type, details, user_id)
    RETURNING id INTO log_id;
    
    RETURN log_id;
EXCEPTION
    WHEN OTHERS THEN
        -- In case of error, propagate the error
        RAISE;
END;
$$;


ALTER FUNCTION "public"."log_system_event"("event_type" "text", "details" "jsonb", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_system_event"("p_event_type" "text", "p_message" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.system_logs (event_type, message, metadata)
    VALUES (p_event_type, p_message, p_metadata);
END;
$$;


ALTER FUNCTION "public"."log_system_event"("p_event_type" "text", "p_message" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_action"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Log user action into activity log
    INSERT INTO public.user_activity_log (
        user_id,
        action_type,
        entity_id,
        entity_type,
        metadata
    )
    VALUES (
        COALESCE(NEW.user_id, auth.uid()), -- Use the record's user_id if available, otherwise current user
        TG_ARGV[0], -- First argument is the action type
        COALESCE(NEW.id, NULL), -- Use the record's ID if available
        TG_TABLE_NAME, -- Use the table name as entity type
        to_jsonb(NEW) -- Store the entire record as metadata
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_user_action"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."logged_function_example"("param1" "text", "param2" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  result text;
  success boolean := true;
  error_msg text;
BEGIN
  BEGIN
    -- Function logic here
    result := 'Result: ' || param1 || ' ' || param2::text;
    
    -- Log successful execution
    INSERT INTO private.function_execution_log
      (function_name, user_id, parameters, success)
    VALUES
      ('logged_function_example', auth.uid(), 
       jsonb_build_object('param1', param1, 'param2', param2),
       true);
       
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    -- Log failed execution
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    
    INSERT INTO private.function_execution_log
      (function_name, user_id, parameters, success, error_message)
    VALUES
      ('logged_function_example', auth.uid(), 
       jsonb_build_object('param1', param1, 'param2', param2),
       false, error_msg);
       
    RAISE; -- Re-throw the exception
  END;
END;
$$;


ALTER FUNCTION "public"."logged_function_example"("param1" "text", "param2" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."maintain_analytics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Update analytics data
    INSERT INTO public.analytics_events (
        user_id,
        event_type,
        entity_id,
        entity_type,
        event_data
    )
    VALUES (
        auth.uid(),
        TG_ARGV[0], -- Event type passed as first argument
        NEW.id,
        TG_TABLE_NAME,
        to_jsonb(NEW)
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."maintain_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_auth_user_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  insert into public.user_profiles (id, full_name, phone, region, spirituality)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email, ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'region',
    new.raw_user_meta_data->>'spirituality'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    phone = coalesce(excluded.phone, public.user_profiles.phone),
    region = coalesce(excluded.region, public.user_profiles.region),
    spirituality = coalesce(excluded.spirituality, public.user_profiles.spirituality),
    updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."on_auth_user_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_affiliate_commission"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    affiliate_id uuid;
    commission_percent numeric;
    commission_amount_cents integer;
BEGIN
    -- Find affiliate by referral token if this purchase has a referral
    IF NEW.referral_token IS NOT NULL AND NEW.referral_token != '' THEN
        SELECT a.id, a.commission_percent 
        INTO affiliate_id, commission_percent
        FROM public.affiliates a
        JOIN public.profiles p ON a.user_id = p.id
        WHERE p.referral_token = NEW.referral_token;
        
        -- If affiliate found, create commission record
        IF affiliate_id IS NOT NULL THEN
            -- Calculate commission (simplified example)
            commission_amount_cents := (NEW.amount_cents * commission_percent / 100)::integer;
            
            -- Create commission record
            INSERT INTO public.affiliate_commissions (
                affiliate_id,
                user_id,
                purchase_id,
                amount_cents,
                status
            ) VALUES (
                affiliate_id,
                NEW.user_id,
                NEW.id,
                commission_amount_cents,
                'pending'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."process_affiliate_commission"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "age" integer,
    "weight" numeric(5,2),
    "height" integer,
    "activity_level" "text" NOT NULL,
    "health_goals" "text"[] DEFAULT '{}'::"text"[],
    "onboarding_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'client'::"text",
    "full_name" "text",
    "avatar_url" "text",
    "phone" character varying(20),
    "current_weight" numeric(5,2),
    "target_weight" numeric(5,2),
    "gender" character varying(10),
    "goal_type" character varying(50),
    "total_points" integer DEFAULT 0,
    "current_level" integer DEFAULT 1,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_activity_date" "date",
    "whatsapp" character varying(20),
    "cultural_context" "text",
    "spiritual_belief" "text",
    "region" "text",
    CONSTRAINT "check_activity_level" CHECK ((("activity_level" = ANY (ARRAY['sedentary'::"text", 'light'::"text", 'moderate'::"text", 'very_active'::"text", 'super_active'::"text"])) OR ("activity_level" IS NULL))),
    CONSTRAINT "check_goal_type" CHECK (((("goal_type")::"text" = ANY ((ARRAY['lose_weight'::character varying, 'gain_muscle'::character varying, 'maintain_weight'::character varying, 'improve_fitness'::character varying, 'general_health'::character varying])::"text"[])) OR ("goal_type" IS NULL)))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."age" IS 'Age for personalized recommendations';



COMMENT ON COLUMN "public"."user_profiles"."height" IS 'Height in cm for BMI calculations';



COMMENT ON COLUMN "public"."user_profiles"."activity_level" IS 'Activity level (sedentary/light/moderate/active/very_active)';



COMMENT ON COLUMN "public"."user_profiles"."full_name" IS 'Full name of the user';



COMMENT ON COLUMN "public"."user_profiles"."phone" IS 'Phone number for client contact';



COMMENT ON COLUMN "public"."user_profiles"."current_weight" IS 'Current weight in kg for progress tracking';



COMMENT ON COLUMN "public"."user_profiles"."target_weight" IS 'Target weight in kg for goal setting';



COMMENT ON COLUMN "public"."user_profiles"."gender" IS 'Gender for personalized recommendations (male/female/other)';



COMMENT ON COLUMN "public"."user_profiles"."goal_type" IS 'Primary fitness/health goal type';



COMMENT ON COLUMN "public"."user_profiles"."whatsapp" IS 'WhatsApp number for client contact';



COMMENT ON COLUMN "public"."user_profiles"."region" IS 'Região/UF opcional informada pelo usuário.';



CREATE OR REPLACE FUNCTION "public"."safe_upsert_user_profile"("p_user_id" "uuid", "p_full_name" "text" DEFAULT NULL::"text", "p_name" "text" DEFAULT NULL::"text", "p_email" "text" DEFAULT NULL::"text", "p_phone" character varying DEFAULT NULL::character varying, "p_age" integer DEFAULT NULL::integer, "p_height" integer DEFAULT NULL::integer, "p_current_weight" numeric DEFAULT NULL::numeric, "p_target_weight" numeric DEFAULT NULL::numeric, "p_gender" character varying DEFAULT NULL::character varying, "p_activity_level" character varying DEFAULT NULL::character varying, "p_goal_type" character varying DEFAULT NULL::character varying) RETURNS "public"."user_profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result user_profiles;
    normalized_activity_level VARCHAR(30);
    normalized_goal_type VARCHAR(50);
BEGIN
    -- Validar e normalizar activity_level
    normalized_activity_level := CASE 
        WHEN p_activity_level IN ('sedentário', 'sedentario') THEN 'sedentary'
        WHEN p_activity_level = 'levemente ativo' THEN 'light'
        WHEN p_activity_level = 'moderadamente ativo' THEN 'moderate'
        WHEN p_activity_level = 'muito ativo' THEN 'very_active'
        WHEN p_activity_level = 'extremamente ativo' THEN 'super_active'
        WHEN p_activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'super_active') THEN p_activity_level
        ELSE NULL
    END;
    
    -- Validar e normalizar goal_type
    normalized_goal_type := CASE 
        WHEN p_goal_type IN ('perder peso', 'perder_peso') THEN 'lose_weight'
        WHEN p_goal_type IN ('ganhar massa muscular', 'ganhar_massa') THEN 'gain_muscle'
        WHEN p_goal_type IN ('manter peso atual', 'manter_peso') THEN 'maintain_weight'
        WHEN p_goal_type IN ('melhorar condicionamento', 'melhorar_condicionamento') THEN 'improve_fitness'
        WHEN p_goal_type IN ('saúde geral', 'saude_geral') THEN 'general_health'
        WHEN p_goal_type IN ('lose_weight', 'gain_muscle', 'maintain_weight', 'improve_fitness', 'general_health') THEN p_goal_type
        ELSE NULL
    END;

    -- Validar outros campos
    IF p_age IS NOT NULL AND (p_age < 1 OR p_age > 150) THEN
        RAISE EXCEPTION 'Age must be between 1 and 150';
    END IF;
    
    IF p_height IS NOT NULL AND (p_height < 1 OR p_height > 300) THEN
        RAISE EXCEPTION 'Height must be between 1 and 300 cm';
    END IF;
    
    IF p_current_weight IS NOT NULL AND (p_current_weight < 1 OR p_current_weight > 1000) THEN
        RAISE EXCEPTION 'Current weight must be between 1 and 1000 kg';
    END IF;
    
    IF p_target_weight IS NOT NULL AND (p_target_weight < 1 OR p_target_weight > 1000) THEN
        RAISE EXCEPTION 'Target weight must be between 1 and 1000 kg';
    END IF;

    -- Safe upsert
    INSERT INTO user_profiles (
        id, full_name, name, email, phone, age, height, 
        current_weight, target_weight, gender, activity_level, goal_type,
        created_at, updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        COALESCE(p_name, p_full_name),
        p_email,
        p_phone,
        p_age,
        p_height,
        p_current_weight,
        p_target_weight,
        p_gender,
        normalized_activity_level,
        normalized_goal_type,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        name = COALESCE(EXCLUDED.name, EXCLUDED.full_name, user_profiles.name),
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        age = COALESCE(EXCLUDED.age, user_profiles.age),
        height = COALESCE(EXCLUDED.height, user_profiles.height),
        current_weight = COALESCE(EXCLUDED.current_weight, user_profiles.current_weight),
        target_weight = COALESCE(EXCLUDED.target_weight, user_profiles.target_weight),
        gender = COALESCE(EXCLUDED.gender, user_profiles.gender),
        activity_level = COALESCE(EXCLUDED.activity_level, user_profiles.activity_level),
        goal_type = COALESCE(EXCLUDED.goal_type, user_profiles.goal_type),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;

$$;


ALTER FUNCTION "public"."safe_upsert_user_profile"("p_user_id" "uuid", "p_full_name" "text", "p_name" "text", "p_email" "text", "p_phone" character varying, "p_age" integer, "p_height" integer, "p_current_weight" numeric, "p_target_weight" numeric, "p_gender" character varying, "p_activity_level" character varying, "p_goal_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_records"("search_term" "text", "category" "text" DEFAULT NULL::"text", "max_results" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "title" "text", "description" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Validate inputs
  IF search_term IS NULL OR length(trim(search_term)) < 3 THEN
    RAISE EXCEPTION 'Search term must be at least 3 characters';
  END IF;
  
  -- Validate category using enum or list
  IF category IS NOT NULL AND category NOT IN ('products', 'articles', 'users') THEN
    RAISE EXCEPTION 'Invalid category. Must be one of: products, articles, users';
  END IF;
  
  -- Validate numeric range
  IF max_results < 1 OR max_results > 1000 THEN
    RAISE EXCEPTION 'max_results must be between 1 and 1000';
  END IF;
  
  -- Use parametrized query to prevent SQL injection
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description
  FROM 
    public.records r
  WHERE 
    (r.title ILIKE '%' || search_term || '%' OR 
     r.description ILIKE '%' || search_term || '%')
    AND (category IS NULL OR r.category = category)
  ORDER BY 
    r.created_at DESC
  LIMIT 
    max_results;
END;
$$;


ALTER FUNCTION "public"."search_records"("search_term" "text", "category" "text", "max_results" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."secure_resource_access"("resource_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Always set search_path explicitly to prevent hijacking
    SET search_path = '';
    
    -- Set other security settings
    SET statement_timeout = '5s';
    
    -- Function logic with schema-qualified names
    RETURN EXISTS (
        SELECT 1 
        FROM public.resources r
        WHERE r.id = resource_id
          AND r.is_accessible = true
    );
END;
$$;


ALTER FUNCTION "public"."secure_resource_access"("resource_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Set default role for new users
    IF NEW.role IS NULL THEN
        NEW.role = 'user';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_default_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end; $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_auth_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Sync user data from auth.users to profiles
    UPDATE public.profiles
    SET 
        email = NEW.email,
        last_sign_in_at = NEW.last_sign_in_at,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_auth_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if to_regclass('public.user_profiles') is not null then
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='user_profiles' and column_name='email') then
      update public.user_profiles set email = new.email where id = new.id;
    end if;
  elsif to_regclass('public.profiles') is not null then
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='profiles' and column_name='email') then
      update public.profiles set email = new.email where id = new.id;
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_profile_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_complete_signup"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RAISE NOTICE 'Test complete signup executed';
END;
$$;


ALTER FUNCTION "public"."test_complete_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_handle_new_user"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RAISE NOTICE 'Test handle new user executed';
END;
$$;


ALTER FUNCTION "public"."test_handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_handle_new_user"("user_id_param" "uuid", "email_param" "text" DEFAULT NULL::"text", "name_param" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  meta_data jsonb;
BEGIN
  -- Preparar os metadados simulados
  IF name_param IS NOT NULL THEN
    meta_data := jsonb_build_object('name', name_param);
  ELSE
    meta_data := '{}'::jsonb;
  END IF;

  -- Testar inserção em user_profiles
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    INSERT INTO public.user_profiles (user_id, name)
    VALUES (user_id_param, COALESCE(name_param, email_param))
    ON CONFLICT (user_id) DO NOTHING;
    RAISE NOTICE 'Inserção em user_profiles realizada com sucesso para user_id: %', user_id_param;
  ELSE
    RAISE NOTICE 'Tabela user_profiles não encontrada';
  END IF;
  
  -- Testar inserção em profiles
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    INSERT INTO public.profiles (id, role)
    VALUES (user_id_param, 'client')
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Inserção em profiles realizada com sucesso para id: %', user_id_param;
  ELSE
    RAISE NOTICE 'Tabela profiles não encontrada';
  END IF;
END;
$$;


ALTER FUNCTION "public"."test_handle_new_user"("user_id_param" "uuid", "email_param" "text", "name_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_profile_creation"("user_id" "uuid", "user_email" "text", "user_phone" "text", "user_meta" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
    test_user record;
BEGIN
    -- Simular um novo usuário com os dados fornecidos
    test_user := row(
        user_id, 
        user_email, 
        user_phone,
        user_meta,
        '{}'::jsonb, -- app_meta_data vazio
        now(),       -- tempo de confirmação
        now()        -- tempo de criação
    )::auth.users;
    
    -- Chamar a função de criação de perfil manualmente
    PERFORM public.handle_new_user();
    
    -- Verificar se o perfil foi criado
    SELECT row_to_json(p)::jsonb INTO result
    FROM public.profiles p
    WHERE p.id = user_id;
    
    IF result IS NULL THEN
        result := jsonb_build_object('error', 'Perfil não criado', 'user_id', user_id);
    ELSE
        result := jsonb_build_object('success', true, 'profile', result);
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."test_profile_creation"("user_id" "uuid", "user_email" "text", "user_phone" "text", "user_meta" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_query_performance"("query_text" "text", "num_executions" integer DEFAULT 5) RETURNS TABLE("execution_number" integer, "execution_time_ms" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    start_time timestamptz;
    end_time timestamptz;
    i integer;
BEGIN
    FOR i IN 1..num_executions LOOP
        start_time := clock_timestamp();
        EXECUTE query_text;
        end_time := clock_timestamp();
        
        execution_number := i;
        execution_time_ms := extract(epoch from (end_time - start_time)) * 1000;
        RETURN NEXT;
    END LOOP;
    RETURN;
END;
$$;


ALTER FUNCTION "public"."test_query_performance"("query_text" "text", "num_executions" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_points_on_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM update_user_gamification(
        NEW.user_id, 
        NEW.points_earned, 
        NEW.activity_type, 
        NEW.is_bonus
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_points_on_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_daily_checkins_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_daily_checkins_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Update payment status logic
    -- Update subscription status based on payment status
    IF NEW.status = 'completed' THEN
        UPDATE public.subscriptions
        SET status = 'active'
        WHERE id = NEW.subscription_id;
    ELSIF NEW.status = 'failed' THEN
        UPDATE public.subscriptions
        SET status = 'inactive'
        WHERE id = NEW.subscription_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_gamification"("p_user_id" "uuid", "p_points_to_add" integer, "p_activity_type" "text" DEFAULT NULL::"text", "p_is_bonus" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_total INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current total points
    SELECT total_points INTO current_total 
    FROM gamification 
    WHERE user_id = p_user_id;
    
    -- Calculate new total and level
    current_total := COALESCE(current_total, 0) + p_points_to_add;
    new_level := GREATEST(1, FLOOR(current_total / 1000) + 1);
    
    -- Update gamification table
    INSERT INTO gamification (user_id, total_points, level)
    VALUES (p_user_id, current_total, new_level)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = current_total,
        level = new_level,
        physical_points = CASE WHEN p_activity_type = 'physical' THEN gamification.physical_points + p_points_to_add ELSE gamification.physical_points END,
        nutrition_points = CASE WHEN p_activity_type = 'nutrition' THEN gamification.nutrition_points + p_points_to_add ELSE gamification.nutrition_points END,
        emotional_points = CASE WHEN p_activity_type = 'emotional' THEN gamification.emotional_points + p_points_to_add ELSE gamification.emotional_points END,
        spiritual_points = CASE WHEN p_activity_type = 'spiritual' THEN gamification.spiritual_points + p_points_to_add ELSE gamification.spiritual_points END,
        referral_points = CASE WHEN p_activity_type = 'referral' THEN gamification.referral_points + p_points_to_add ELSE gamification.referral_points END,
        achievement_points = CASE WHEN p_activity_type = 'achievement' THEN gamification.achievement_points + p_points_to_add ELSE gamification.achievement_points END,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_user_gamification"("p_user_id" "uuid", "p_points_to_add" integer, "p_activity_type" "text", "p_is_bonus" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_training_plans_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_training_plans_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."academies" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "logo" "text",
    "clients" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."academies" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."academies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."academies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."academies_id_seq" OWNED BY "public"."academies"."id";



CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "owner_id" "uuid" NOT NULL,
    "permission" "text" DEFAULT 'private'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."accessible_resources" WITH ("security_invoker"='on') AS
 SELECT "id",
    "title",
    "content",
    "owner_id",
    "permission",
    "created_at",
    "updated_at",
    ("owner_id" = "auth"."uid"()) AS "is_owner"
   FROM "public"."resources";


ALTER VIEW "public"."accessible_resources" OWNER TO "postgres";


COMMENT ON VIEW "public"."accessible_resources" IS 'Visualização segura dos recursos acessíveis pelo usuário atual';



CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50) DEFAULT '🏆'::character varying,
    "points_required" integer DEFAULT 0,
    "badge_color" character varying(20) DEFAULT 'blue'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code" "text",
    "category" "text" DEFAULT 'milestone'::"text",
    "points_reward" integer DEFAULT 0,
    "requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_name" "text" NOT NULL,
    "points_earned" integer DEFAULT 0,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activity_tracking_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['exercise'::"text", 'nutrition'::"text", 'meditation'::"text", 'general'::"text"]))),
    CONSTRAINT "activity_tracking_points_earned_check" CHECK (("points_earned" >= 0))
);


ALTER TABLE "public"."activity_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_clicks" (
    "id" bigint NOT NULL,
    "code" "text",
    "clicked_at" timestamp with time zone DEFAULT "now"(),
    "ip" "text",
    "ua" "text"
);


ALTER TABLE "public"."affiliate_clicks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."affiliate_clicks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."affiliate_clicks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."affiliate_clicks_id_seq" OWNED BY "public"."affiliate_clicks"."id";



CREATE TABLE IF NOT EXISTS "public"."affiliate_commissions" (
    "id" bigint NOT NULL,
    "partner_id" "uuid",
    "conversion_id" bigint,
    "amount_cents" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone
);


ALTER TABLE "public"."affiliate_commissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."affiliate_commissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."affiliate_commissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."affiliate_commissions_id_seq" OWNED BY "public"."affiliate_commissions"."id";



CREATE TABLE IF NOT EXISTS "public"."affiliate_conversions" (
    "id" bigint NOT NULL,
    "code" "text",
    "user_id" "uuid",
    "plan" "text",
    "amount_cents" integer,
    "occurred_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."affiliate_conversions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."affiliate_conversions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."affiliate_conversions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."affiliate_conversions_id_seq" OWNED BY "public"."affiliate_conversions"."id";



CREATE TABLE IF NOT EXISTS "public"."affiliate_links" (
    "code" "text" NOT NULL,
    "partner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."affiliate_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "display_name" "text",
    "percent" numeric DEFAULT 0.30,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."affiliates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_coach_actions" (
    "action_name" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_coach_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_coach_settings" (
    "id" integer NOT NULL,
    "system_prompt" "text" NOT NULL,
    "opening_message" "text" DEFAULT 'Olá! Como posso te ajudar hoje? 😊'::"text",
    "tone" "text" DEFAULT 'objetivo e acolhedor'::"text",
    "max_questions" integer DEFAULT 1,
    "use_emojis" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_coach_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "phone" "text" NOT NULL,
    "step" "text" DEFAULT 'start'::"text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_events" (
    "id" bigint NOT NULL,
    "phone" "text" NOT NULL,
    "type" "text" NOT NULL,
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_events_id_seq" OWNED BY "public"."ai_events"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_interactions" (
    "id" bigint NOT NULL,
    "phone" "text" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_interactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_interactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_interactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_interactions_id_seq" OWNED BY "public"."ai_interactions"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" bigint NOT NULL,
    "phone" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "text" "text" NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "direction" "text" DEFAULT 'in'::"text",
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_messages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_messages_id_seq" OWNED BY "public"."ai_messages"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_nudges" (
    "id" bigint NOT NULL,
    "phone" "text" NOT NULL,
    "text" "text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "tries" integer DEFAULT 0 NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_nudges" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_nudges_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_nudges_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_nudges_id_seq" OWNED BY "public"."ai_nudges"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_settings" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "content" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_settings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_settings_id_seq" OWNED BY "public"."ai_settings"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_users" (
    "phone" "text" NOT NULL,
    "goal" "text",
    "next_action" "text",
    "last_plan_generated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reminder_opt_in" boolean DEFAULT false,
    "reminder_time" "text",
    "motivation_opt_in" boolean DEFAULT false,
    "style" "text",
    "first_name" "text",
    "name" "text",
    "wants_reminders" boolean DEFAULT false,
    "wants_quotes" boolean DEFAULT false,
    "stage" "text" DEFAULT 'new'::"text",
    "training_place" "text",
    "display_name" "text",
    "first_seen_at" timestamp with time zone DEFAULT "now"(),
    "interactions" integer DEFAULT 0,
    "checkins_ok" integer DEFAULT 0,
    "plan_sent_at" timestamp with time zone,
    "upgrade_offered_at" timestamp with time zone,
    "referral_offered_at" timestamp with time zone,
    "reminders_on" boolean DEFAULT false,
    "referral_token" "text",
    "train_pref" "text",
    "days_per_week" integer,
    "minutes_per_session" integer,
    "level" "text",
    "equipment" "text",
    "train_time" "text",
    "pain_limitations" "text",
    "motivation_style" "text",
    "spiritual_opt_in" boolean DEFAULT false,
    "weight_kg" numeric,
    "height_cm" numeric,
    "bodyfat_pct" numeric,
    "waist_cm" numeric,
    "hip_cm" numeric,
    "train_days_per_week" integer,
    "minutes_per_day" integer,
    "train_context" "text",
    "sleep_focus" boolean DEFAULT false,
    "diet_pref" "text" DEFAULT 'onivoro'::"text",
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "plan_fail_at" timestamp with time zone,
    "weight" numeric,
    "height" numeric,
    "missing" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    "step" "text" DEFAULT 'discovery'::"text",
    "last_question_id" "text",
    "attempt_count" integer DEFAULT 0,
    "last_ask" timestamp with time zone,
    "welcomed_at" timestamp with time zone,
    "last_step_sent_at" timestamp with time zone,
    "last_bot_sig" "text",
    "last_user_msg_at" timestamp with time zone,
    "last_bot" "text",
    "last_user" "text",
    "last_user_hash" "text",
    "last_user_at" timestamp with time zone,
    "state" "text",
    "last_ask_at" timestamp with time zone,
    "last_ai" "text",
    "last_ai_at" timestamp with time zone,
    "persona_json" "jsonb",
    "context_json" "jsonb",
    "plan_summary" "text",
    "cooldown_until" timestamp with time zone,
    CONSTRAINT "ai_users_context_check" CHECK (("train_context" = ANY (ARRAY['casa'::"text", 'academia'::"text", 'hibrido'::"text"]))),
    CONSTRAINT "ai_users_days_check" CHECK ((("days_per_week" >= 1) AND ("days_per_week" <= 7))),
    CONSTRAINT "ai_users_level_check" CHECK (("level" = ANY (ARRAY['iniciante'::"text", 'intermediario'::"text", 'avancado'::"text"]))),
    CONSTRAINT "ai_users_minutes_check" CHECK ((("minutes_per_day" >= 5) AND ("minutes_per_day" <= 180))),
    CONSTRAINT "ai_users_step_check" CHECK (("step" = ANY (ARRAY['discovery'::"text", 'support'::"text", 'progress'::"text"]))),
    CONSTRAINT "ai_users_training_place_check" CHECK (("training_place" = ANY (ARRAY['casa'::"text", 'academia'::"text"])))
);


ALTER TABLE "public"."ai_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "id" "text",
    "ai_system_prompt" "text",
    "ai_system_prompt_full" "text"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automations" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."automations" OWNER TO "postgres";


COMMENT ON TABLE "public"."automations" IS 'Stores automation configurations and their active status.';



CREATE TABLE IF NOT EXISTS "public"."badges" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_subscriptions" (
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "price_id" "text",
    "status" "text",
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."billing_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "day" "date" NOT NULL,
    "completed" boolean DEFAULT false,
    "mood" integer,
    "sleep_hours" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_user_state" (
    "user_id" "uuid" NOT NULL,
    "goal" "text",
    "training_lvl" "text",
    "diet_notes" "text",
    "sleep_notes" "text",
    "last_summary" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coach_user_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "content" "text",
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_code" "text" NOT NULL,
    "user_id" "uuid",
    "amount_cents" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "period_month" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "likes" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."community_feed" AS
 SELECT "id",
    "user_id",
    "content",
    "created_at",
    "created_at" AS "updated_at",
    0 AS "likes_count",
    0 AS "comments_count"
   FROM "public"."community_posts"
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."community_feed" OWNER TO "postgres";


COMMENT ON VIEW "public"."community_feed" IS 'View segura para exibir posts da comunidade publicados';



CREATE OR REPLACE VIEW "public"."comunidade" AS
 SELECT "id",
    "user_id",
    "content",
    "likes",
    "created_at"
   FROM "public"."community_posts";


ALTER VIEW "public"."comunidade" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "message_type" "text" NOT NULL,
    "message_content" "text" NOT NULL,
    "sentiment_score" numeric(3,2) DEFAULT 0.0,
    "topics" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "conversation_history_message_type_check" CHECK (("message_type" = ANY (ARRAY['user'::"text", 'assistant'::"text"]))),
    CONSTRAINT "conversation_history_sentiment_score_check" CHECK ((("sentiment_score" >= '-1.0'::numeric) AND ("sentiment_score" <= 1.0)))
);


ALTER TABLE "public"."conversation_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "role" "text",
    "content" "text",
    "message_id" "text"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "activity_type" character varying(50) NOT NULL,
    "points_earned" integer DEFAULT 0,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "weight" numeric(5,2),
    "mood" integer,
    "sleep_hours" numeric(3,1),
    "water_glasses" integer DEFAULT 0 NOT NULL,
    "exercise_minutes" integer DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "mood_score" integer,
    "energy_level" integer,
    "stress_level" integer,
    CONSTRAINT "daily_checkins_energy_level_check" CHECK ((("energy_level" >= 1) AND ("energy_level" <= 5))),
    CONSTRAINT "daily_checkins_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5))),
    CONSTRAINT "daily_checkins_stress_level_check" CHECK ((("stress_level" >= 1) AND ("stress_level" <= 5)))
);


ALTER TABLE "public"."daily_checkins" OWNER TO "postgres";


COMMENT ON COLUMN "public"."daily_checkins"."weight" IS 'Daily weight measurement in kg';



COMMENT ON COLUMN "public"."daily_checkins"."sleep_hours" IS 'Hours of sleep for recovery tracking';



COMMENT ON COLUMN "public"."daily_checkins"."mood_score" IS 'Mood score from 1-5 for wellbeing tracking';



COMMENT ON COLUMN "public"."daily_checkins"."energy_level" IS 'Energy level from 1-5';



COMMENT ON COLUMN "public"."daily_checkins"."stress_level" IS 'Stress level from 1-5';



CREATE TABLE IF NOT EXISTS "public"."daily_metrics" (
    "user_id" "uuid" NOT NULL,
    "day" "date" NOT NULL,
    "weight_kg" numeric(5,2),
    "steps" integer,
    "workouts" integer,
    "sleep_hours" numeric(4,2)
);


ALTER TABLE "public"."daily_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_missions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "mission_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "mission_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "target_value" "jsonb" DEFAULT '{}'::"jsonb",
    "current_progress" "jsonb" DEFAULT '{}'::"jsonb",
    "points_reward" integer DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_missions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" bigint NOT NULL,
    "context" "text",
    "details" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."error_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."error_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."error_logs_id_seq" OWNED BY "public"."error_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."gamification" (
    "user_id" "uuid" NOT NULL,
    "total_points" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "badges" "text"[] DEFAULT '{}'::"text"[],
    "weekly_goal_progress" integer DEFAULT 0,
    "monthly_goal_progress" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "physical_points" integer DEFAULT 0,
    "nutrition_points" integer DEFAULT 0,
    "emotional_points" integer DEFAULT 0,
    "spiritual_points" integer DEFAULT 0,
    "referral_points" integer DEFAULT 0,
    "achievement_points" integer DEFAULT 0,
    "weekly_points" integer DEFAULT 0,
    "monthly_points" integer DEFAULT 0,
    "yearly_points" integer DEFAULT 0,
    CONSTRAINT "gamification_achievement_points_check" CHECK (("achievement_points" >= 0)),
    CONSTRAINT "gamification_current_streak_check" CHECK (("current_streak" >= 0)),
    CONSTRAINT "gamification_emotional_points_check" CHECK (("emotional_points" >= 0)),
    CONSTRAINT "gamification_level_check" CHECK (("level" >= 1)),
    CONSTRAINT "gamification_longest_streak_check" CHECK (("longest_streak" >= 0)),
    CONSTRAINT "gamification_monthly_goal_progress_check" CHECK ((("monthly_goal_progress" >= 0) AND ("monthly_goal_progress" <= 100))),
    CONSTRAINT "gamification_monthly_points_check" CHECK (("monthly_points" >= 0)),
    CONSTRAINT "gamification_nutrition_points_check" CHECK (("nutrition_points" >= 0)),
    CONSTRAINT "gamification_physical_points_check" CHECK (("physical_points" >= 0)),
    CONSTRAINT "gamification_referral_points_check" CHECK (("referral_points" >= 0)),
    CONSTRAINT "gamification_spiritual_points_check" CHECK (("spiritual_points" >= 0)),
    CONSTRAINT "gamification_total_points_check" CHECK (("total_points" >= 0)),
    CONSTRAINT "gamification_weekly_goal_progress_check" CHECK ((("weekly_goal_progress" >= 0) AND ("weekly_goal_progress" <= 100))),
    CONSTRAINT "gamification_weekly_points_check" CHECK (("weekly_points" >= 0)),
    CONSTRAINT "gamification_yearly_points_check" CHECK (("yearly_points" >= 0))
);


ALTER TABLE "public"."gamification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gamification_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "event_type" "text" NOT NULL,
    "category" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "rewards" "jsonb" DEFAULT '{}'::"jsonb",
    "bonus_multiplier" numeric(3,2) DEFAULT 1.0,
    "is_active" boolean DEFAULT true,
    "max_participants" integer,
    "current_participants" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gamification_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_logs" (
    "habit_id" "uuid" NOT NULL,
    "day" "date" NOT NULL,
    "done" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."habit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "schedule" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inbound_events" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inbound_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" bigint NOT NULL,
    "service" "text" NOT NULL,
    "credentials" "jsonb" NOT NULL,
    "is_connected" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integrations_evolution" (
    "id" integer DEFAULT 1 NOT NULL,
    "token" "text" NOT NULL,
    "instancename" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "instanceid" "text"
);


ALTER TABLE "public"."integrations_evolution" OWNER TO "postgres";


ALTER TABLE "public"."integrations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."integrations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."integrations_whatsapp" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instance_name" "text" NOT NULL,
    "token" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider" "text" DEFAULT 'evolution_api'::"text" NOT NULL
);


ALTER TABLE "public"."integrations_whatsapp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "ranking_type" "text" NOT NULL,
    "category" "text",
    "points" integer DEFAULT 0 NOT NULL,
    "rank_position" integer,
    "period_start" "date",
    "period_end" "date",
    "city" "text",
    "age_group" "text",
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leaderboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."measurements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "taken_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "weight_kg" numeric,
    "height_cm" numeric,
    "bodyfat_pct" numeric,
    "waist_cm" numeric,
    "hip_cm" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."measurements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nutrition_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "plan" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."nutrition_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "pix_key" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."payout_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid",
    "day_index" integer NOT NULL,
    "focus" "text",
    "workout" "jsonb",
    "habit" "jsonb",
    "nutrition" "jsonb",
    "sleep" "jsonb",
    "minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "trial_days" integer DEFAULT 7,
    "benefits" "text"[],
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stripe_price_id" "text",
    "features" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stripe_price_id" "text"
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."plans_normalized" AS
 SELECT "id" AS "plan_id",
    "stripe_price_id",
    COALESCE(("features" ->> 'name'::"text"), "initcap"(("id")::"text")) AS "name",
    COALESCE(("features" ->> 'tier'::"text"), ("id")::"text") AS "tier",
    COALESCE((("features" ->> 'points_multiplier'::"text"))::numeric, (1)::numeric) AS "points_multiplier",
    COALESCE((("features" ->> 'trial_days'::"text"))::integer, 0) AS "trial_days",
    "features"
   FROM "public"."subscription_plans" "p";


ALTER VIEW "public"."plans_normalized" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."points_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "source" "text" NOT NULL,
    "points" integer NOT NULL,
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."points_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'client'::"text" NOT NULL,
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    "start_weight" numeric,
    "current_weight" numeric,
    "target_weight" numeric,
    "height" numeric,
    "plan" "text" DEFAULT 'trial'::"text",
    "level" integer DEFAULT 1,
    "points" integer DEFAULT 0,
    "referral_code" "text",
    "referred_by" "uuid",
    "referral_token" "text",
    "affiliate_code" "text",
    "name" "text",
    "onboarding_stage" "text",
    "wants_reminders" boolean DEFAULT false,
    "wants_quotes" boolean DEFAULT false,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'client'::"text", 'partner'::"text", 'gym'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "points" integer NOT NULL,
    "icon" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recompensas" AS
 SELECT "id",
    "name",
    "description",
    NULL::numeric AS "points_required",
    NULL::"text" AS "category",
    true AS "is_available",
    "created_at"
   FROM "public"."rewards"
  ORDER BY "id";


ALTER VIEW "public"."recompensas" OWNER TO "postgres";


COMMENT ON VIEW "public"."recompensas" IS 'View segura para exibir recompensas disponíveis';



CREATE TABLE IF NOT EXISTS "public"."redemption_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reward_name" "text" NOT NULL,
    "reward_icon" "text",
    "points_spent" integer NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'completed'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "redemption_history_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."redemption_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid",
    "referred_id" "uuid",
    "referral_code" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "points_earned" integer DEFAULT 0,
    "milestone_reached" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'registered'::"text", 'subscribed'::"text", 'active'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rewards_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rewards_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rewards_id_seq" OWNED BY "public"."rewards"."id";



CREATE TABLE IF NOT EXISTS "public"."stripe_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_webhooks" (
    "id" integer NOT NULL,
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_webhooks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."stripe_webhooks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."stripe_webhooks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."stripe_webhooks_id_seq" OWNED BY "public"."stripe_webhooks"."id";



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan_id" "text",
    "status" "text",
    "current_period_end" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supabase_migrations" (
    "version" "text" NOT NULL,
    "statements" "text"[],
    "name" "text"
);


ALTER TABLE "public"."supabase_migrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."supabase_migrations" IS 'Histórico de migrações sincronizado em 2025-09-16 17:00:00';



CREATE TABLE IF NOT EXISTS "public"."system_logs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "event_type" "text" NOT NULL,
    "details" "jsonb",
    "user_id" "uuid"
);


ALTER TABLE "public"."system_logs" OWNER TO "postgres";


ALTER TABLE "public"."system_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."system_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."training_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "plan" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."training_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "achievement_name" "text" NOT NULL,
    "achievement_description" "text",
    "achievement_type" "text" NOT NULL,
    "points_value" integer DEFAULT 0,
    "unlocked_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_achievements_achievement_type_check" CHECK (("achievement_type" = ANY (ARRAY['fitness'::"text", 'nutrition'::"text", 'mental_health'::"text", 'spirituality'::"text", 'streak'::"text", 'points'::"text"]))),
    CONSTRAINT "user_achievements_points_value_check" CHECK (("points_value" >= 0))
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "user_id" "uuid" NOT NULL,
    "badge_code" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_event_participation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "current_progress" "jsonb" DEFAULT '{}'::"jsonb",
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "points_earned" integer DEFAULT 0,
    "rank_position" integer
);


ALTER TABLE "public"."user_event_participation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_integrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_name" "text" NOT NULL,
    "is_connected" boolean DEFAULT false NOT NULL,
    "credentials" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_metrics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "weight" numeric,
    "mood_score" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sleep_hours" numeric
);


ALTER TABLE "public"."user_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "started_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "user_plans_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."user_plans" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_progress" AS
 SELECT "up"."id" AS "user_id",
    "up"."full_name",
    "up"."current_weight",
    "up"."target_weight",
    "up"."height",
    "public"."calculate_bmi"("up"."current_weight", ("up"."height")::numeric) AS "current_bmi",
    "public"."calculate_bmi"("up"."target_weight", ("up"."height")::numeric) AS "target_bmi",
    "up"."goal_type",
    "up"."activity_level",
    "count"("dc"."id") AS "total_checkins",
    "avg"("dc"."mood_score") AS "avg_mood",
    "avg"("dc"."sleep_hours") AS "avg_sleep",
    "max"("dc"."created_at") AS "last_checkin",
    ( SELECT "daily_checkins"."weight"
           FROM "public"."daily_checkins"
          WHERE (("daily_checkins"."user_id" = "up"."id") AND ("daily_checkins"."weight" IS NOT NULL))
          ORDER BY "daily_checkins"."created_at" DESC
         LIMIT 1) AS "latest_weight"
   FROM ("public"."user_profiles" "up"
     LEFT JOIN "public"."daily_checkins" "dc" ON (("up"."id" = "dc"."user_id")))
  GROUP BY "up"."id", "up"."full_name", "up"."current_weight", "up"."target_weight", "up"."height", "up"."goal_type", "up"."activity_level";


ALTER VIEW "public"."user_progress" OWNER TO "postgres";


COMMENT ON VIEW "public"."user_progress" IS 'Comprehensive view of user progress including BMI calculations and check-in statistics';



CREATE TABLE IF NOT EXISTS "public"."user_training_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" character varying(50) DEFAULT 'general_fitness'::character varying NOT NULL,
    "experience_level" character varying(20) DEFAULT 'beginner'::character varying NOT NULL,
    "duration_weeks" integer DEFAULT 4 NOT NULL,
    "plan_data" "jsonb" NOT NULL,
    "generated_by" character varying(50) DEFAULT 'ai_coach'::character varying NOT NULL,
    "generation_prompt" "text",
    "scientific_basis" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "progress_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_training_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_training_plans" IS 'AI-generated personalized training plans with scientific periodization';



COMMENT ON COLUMN "public"."user_training_plans"."plan_data" IS 'Complete plan structure in JSON format with weeks, days, and exercises';



COMMENT ON COLUMN "public"."user_training_plans"."generation_prompt" IS 'AI prompt used for plan generation for reproducibility and debugging';



COMMENT ON COLUMN "public"."user_training_plans"."scientific_basis" IS 'Scientific references and methodologies used in plan generation';



COMMENT ON COLUMN "public"."user_training_plans"."progress_data" IS 'User progress tracking data including completions, weights, and notes';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_client_progress" WITH ("security_invoker"='on') AS
 SELECT "id" AS "user_id",
    "full_name",
    ( SELECT "dm"."weight_kg"
           FROM "public"."daily_metrics" "dm"
          WHERE ("dm"."user_id" = "p"."id")
          ORDER BY "dm"."day" DESC
         LIMIT 1) AS "weight_latest",
    ( SELECT "sum"("dm"."workouts") AS "sum"
           FROM "public"."daily_metrics" "dm"
          WHERE (("dm"."user_id" = "p"."id") AND ("dm"."day" >= (CURRENT_DATE - '7 days'::interval)))) AS "workouts_week",
    ( SELECT "count"(*) AS "count"
           FROM ("public"."habit_logs" "hl"
             JOIN "public"."habits" "h" ON (("h"."id" = "hl"."habit_id")))
          WHERE (("h"."user_id" = "p"."id") AND ("hl"."day" >= (CURRENT_DATE - '7 days'::interval)) AND "hl"."done")) AS "habits_done_week"
   FROM "public"."profiles" "p";


ALTER VIEW "public"."v_client_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_partner_dashboard" WITH ("security_invoker"='on') AS
 SELECT "l"."partner_id",
    "count"(DISTINCT "c"."id") AS "clicks",
    "count"(DISTINCT "conv"."id") AS "conversions",
    COALESCE("sum"("comm"."amount_cents"), (0)::bigint) AS "commissions_cents",
    "sum"(
        CASE
            WHEN ("comm"."status" = 'paid'::"text") THEN "comm"."amount_cents"
            ELSE 0
        END) AS "paid_cents"
   FROM ((("public"."affiliate_links" "l"
     LEFT JOIN "public"."affiliate_clicks" "c" ON (("c"."code" = "l"."code")))
     LEFT JOIN "public"."affiliate_conversions" "conv" ON (("conv"."code" = "l"."code")))
     LEFT JOIN "public"."affiliate_commissions" "comm" ON (("comm"."partner_id" = "l"."partner_id")))
  GROUP BY "l"."partner_id";


ALTER VIEW "public"."v_partner_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_gamification_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "phone" "text",
    "points" integer DEFAULT 0,
    "reason" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."whatsapp_gamification_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "message_content" "text" NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text",
    "webhook_data" "jsonb",
    "received_at" timestamp with time zone DEFAULT "now"(),
    "instance_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "external_id" "text"
);


ALTER TABLE "public"."whatsapp_messages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."academies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."academies_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."affiliate_clicks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."affiliate_clicks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."affiliate_commissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."affiliate_commissions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."affiliate_conversions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."affiliate_conversions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_interactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_interactions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_messages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_messages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_nudges" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_nudges_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."error_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."error_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rewards" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rewards_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stripe_webhooks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."stripe_webhooks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."academies"
    ADD CONSTRAINT "academies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_tracking"
    ADD CONSTRAINT "activity_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_clicks"
    ADD CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_commissions"
    ADD CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_conversions"
    ADD CONSTRAINT "affiliate_conversions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_coach_actions"
    ADD CONSTRAINT "ai_coach_actions_pkey" PRIMARY KEY ("action_name");



ALTER TABLE ONLY "public"."ai_coach_settings"
    ADD CONSTRAINT "ai_coach_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("phone");



ALTER TABLE ONLY "public"."ai_events"
    ADD CONSTRAINT "ai_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_nudges"
    ADD CONSTRAINT "ai_nudges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_settings"
    ADD CONSTRAINT "ai_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."ai_settings"
    ADD CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_users"
    ADD CONSTRAINT "ai_users_pkey" PRIMARY KEY ("phone");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."billing_subscriptions"
    ADD CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."billing_subscriptions"
    ADD CONSTRAINT "billing_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_user_state"
    ADD CONSTRAINT "coach_user_state_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_history"
    ADD CONSTRAINT "conversation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_activities"
    ADD CONSTRAINT "daily_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."daily_metrics"
    ADD CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("user_id", "day");



ALTER TABLE ONLY "public"."daily_missions"
    ADD CONSTRAINT "daily_missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_missions"
    ADD CONSTRAINT "daily_missions_user_id_mission_date_mission_type_key" UNIQUE ("user_id", "mission_date", "mission_type");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gamification_events"
    ADD CONSTRAINT "gamification_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gamification"
    ADD CONSTRAINT "gamification_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("habit_id", "day");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inbound_events"
    ADD CONSTRAINT "inbound_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations_evolution"
    ADD CONSTRAINT "integrations_evolution_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_service_key" UNIQUE ("service");



ALTER TABLE ONLY "public"."integrations_whatsapp"
    ADD CONSTRAINT "integrations_whatsapp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations_whatsapp"
    ADD CONSTRAINT "integrations_whatsapp_provider_key" UNIQUE ("provider");



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_user_id_ranking_type_category_period_start_per_key" UNIQUE ("user_id", "ranking_type", "category", "period_start", "period_end");



ALTER TABLE ONLY "public"."measurements"
    ADD CONSTRAINT "measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrition_plans"
    ADD CONSTRAINT "nutrition_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_requests"
    ADD CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_days"
    ADD CONSTRAINT "plan_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."points_ledger"
    ADD CONSTRAINT "points_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemption_history"
    ADD CONSTRAINT "redemption_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_referred_id_key" UNIQUE ("referrer_id", "referred_id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_event_id_key" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_webhooks"
    ADD CONSTRAINT "stripe_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."supabase_migrations"
    ADD CONSTRAINT "supabase_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_plans"
    ADD CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "unique_user_date_checkin" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "uq_subs_stripe_subscription_id" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_id", "badge_code");



ALTER TABLE ONLY "public"."user_event_participation"
    ADD CONSTRAINT "user_event_participation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_event_participation"
    ADD CONSTRAINT "user_event_participation_user_id_event_id_key" UNIQUE ("user_id", "event_id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_service_name_key" UNIQUE ("user_id", "service_name");



ALTER TABLE ONLY "public"."user_metrics"
    ADD CONSTRAINT "user_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_metrics"
    ADD CONSTRAINT "user_metrics_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_training_plans"
    ADD CONSTRAINT "user_training_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "ux_achievements_code" UNIQUE ("code");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_gamification_log"
    ADD CONSTRAINT "whatsapp_gamification_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id");



CREATE INDEX "ai_interactions_phone_idx" ON "public"."ai_interactions" USING "btree" ("phone", "created_at" DESC);



CREATE INDEX "ai_messages_phone_created_idx" ON "public"."ai_messages" USING "btree" ("phone", "created_at" DESC);



CREATE INDEX "ai_nudges_due_idx" ON "public"."ai_nudges" USING "btree" ("status", "scheduled_at");



CREATE INDEX "ai_users_last_user_at_idx" ON "public"."ai_users" USING "btree" ("last_user_at" DESC);



CREATE INDEX "ai_users_next_action_idx" ON "public"."ai_users" USING "btree" ("next_action");



CREATE INDEX "ai_users_phone_idx" ON "public"."ai_users" USING "btree" ("phone");



CREATE UNIQUE INDEX "ai_users_phone_uidx" ON "public"."ai_users" USING "btree" ("phone");



CREATE INDEX "ai_users_state_idx" ON "public"."ai_users" USING "btree" ("state");



CREATE INDEX "idx_activity_tracking_completed_at" ON "public"."activity_tracking" USING "btree" ("completed_at");



CREATE INDEX "idx_activity_tracking_phone_number" ON "public"."activity_tracking" USING "btree" ("phone_number");



CREATE INDEX "idx_activity_tracking_type" ON "public"."activity_tracking" USING "btree" ("activity_type");



CREATE INDEX "idx_ai_events_phone_time" ON "public"."ai_events" USING "btree" ("phone", "created_at" DESC);



CREATE INDEX "idx_ai_events_type" ON "public"."ai_events" USING "btree" ("type");



CREATE INDEX "idx_ai_users_last_plan" ON "public"."ai_users" USING "btree" ("last_plan_generated_at" DESC);



CREATE INDEX "idx_ai_users_step" ON "public"."ai_users" USING "btree" ("step");



CREATE INDEX "idx_billing_subscriptions_subscription" ON "public"."billing_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_community_posts_created_at" ON "public"."community_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_community_posts_user_id" ON "public"."community_posts" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_history_created_at" ON "public"."conversation_history" USING "btree" ("created_at");



CREATE INDEX "idx_conversation_history_message_type" ON "public"."conversation_history" USING "btree" ("message_type");



CREATE INDEX "idx_conversation_history_phone_number" ON "public"."conversation_history" USING "btree" ("phone_number");



CREATE INDEX "idx_conversations_user_id" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "idx_daily_checkins_created_at" ON "public"."daily_checkins" USING "btree" ("created_at");



CREATE INDEX "idx_daily_checkins_date" ON "public"."daily_checkins" USING "btree" ("date");



CREATE INDEX "idx_daily_checkins_mood_score" ON "public"."daily_checkins" USING "btree" ("mood_score");



CREATE INDEX "idx_daily_checkins_user_date" ON "public"."daily_checkins" USING "btree" ("user_id", "date");



CREATE INDEX "idx_daily_checkins_user_id" ON "public"."daily_checkins" USING "btree" ("user_id");



CREATE INDEX "idx_daily_checkins_user_id_date" ON "public"."daily_checkins" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_daily_checkins_weight" ON "public"."daily_checkins" USING "btree" ("weight");



CREATE INDEX "idx_daily_missions_completion" ON "public"."daily_missions" USING "btree" ("is_completed", "mission_date" DESC);



CREATE INDEX "idx_daily_missions_user_date" ON "public"."daily_missions" USING "btree" ("user_id", "mission_date" DESC);



CREATE INDEX "idx_events_active_dates" ON "public"."gamification_events" USING "btree" ("is_active", "start_date", "end_date");



CREATE INDEX "idx_gamification_level" ON "public"."gamification" USING "btree" ("level" DESC);



CREATE INDEX "idx_gamification_total_points" ON "public"."gamification" USING "btree" ("total_points" DESC);



CREATE INDEX "idx_gamification_user_id" ON "public"."gamification" USING "btree" ("user_id");



CREATE INDEX "idx_leaderboards_points" ON "public"."leaderboards" USING "btree" ("points" DESC);



CREATE INDEX "idx_leaderboards_rank" ON "public"."leaderboards" USING "btree" ("rank_position");



CREATE INDEX "idx_leaderboards_type_category" ON "public"."leaderboards" USING "btree" ("ranking_type", "category");



CREATE INDEX "idx_post_likes_post_id" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_user_id" ON "public"."post_likes" USING "btree" ("user_id");



CREATE INDEX "idx_resources_owner_id" ON "public"."resources" USING "btree" ("owner_id");



CREATE INDEX "idx_stripe_events_event_id" ON "public"."stripe_events" USING "btree" ("event_id");



CREATE INDEX "idx_subscription_plans_is_active" ON "public"."subscription_plans" USING "btree" ("is_active");



CREATE INDEX "idx_subscriptions_customer" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_subscription" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_system_logs_created_at" ON "public"."system_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_system_logs_event_type" ON "public"."system_logs" USING "btree" ("event_type");



CREATE INDEX "idx_system_logs_user_id" ON "public"."system_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_achievements_phone_number" ON "public"."user_achievements" USING "btree" ("phone_number");



CREATE INDEX "idx_user_achievements_type" ON "public"."user_achievements" USING "btree" ("achievement_type");



CREATE INDEX "idx_user_achievements_unlocked_at" ON "public"."user_achievements" USING "btree" ("unlocked_at");



CREATE INDEX "idx_user_participation_events" ON "public"."user_event_participation" USING "btree" ("user_id", "event_id");



CREATE INDEX "idx_user_profiles_activity_level" ON "public"."user_profiles" USING "btree" ("activity_level");



CREATE INDEX "idx_user_profiles_current_weight" ON "public"."user_profiles" USING "btree" ("current_weight");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_full_name" ON "public"."user_profiles" USING "btree" ("full_name");



CREATE INDEX "idx_user_profiles_goal_type" ON "public"."user_profiles" USING "btree" ("goal_type");



CREATE INDEX "idx_user_profiles_phone" ON "public"."user_profiles" USING "btree" ("phone");



CREATE INDEX "idx_user_training_plans_active" ON "public"."user_training_plans" USING "btree" ("user_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_training_plans_created" ON "public"."user_training_plans" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_training_plans_plan_data_gin" ON "public"."user_training_plans" USING "gin" ("plan_data");



CREATE INDEX "idx_user_training_plans_progress_gin" ON "public"."user_training_plans" USING "gin" ("progress_data");



CREATE INDEX "idx_user_training_plans_type" ON "public"."user_training_plans" USING "btree" ("plan_type");



CREATE INDEX "idx_user_training_plans_user_id" ON "public"."user_training_plans" USING "btree" ("user_id");



CREATE INDEX "idx_whatsapp_gamification_log_created_at" ON "public"."whatsapp_gamification_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_whatsapp_messages_created_at" ON "public"."whatsapp_messages" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "idx_whatsapp_messages_external_id" ON "public"."whatsapp_messages" USING "btree" ("external_id");



CREATE INDEX "idx_whatsapp_messages_instance_id" ON "public"."whatsapp_messages" USING "btree" ("instance_id");



CREATE INDEX "idx_whatsapp_messages_phone_number" ON "public"."whatsapp_messages" USING "btree" ("phone_number");



CREATE INDEX "idx_whatsapp_messages_received_at" ON "public"."whatsapp_messages" USING "btree" ("received_at");



CREATE UNIQUE INDEX "profiles_referral_code_key" ON "public"."profiles" USING "btree" ("referral_code") WHERE ("role" = 'partner'::"text");



CREATE OR REPLACE TRIGGER "ai_users_updated_at" BEFORE UPDATE ON "public"."ai_users" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "app_settings_updated_at" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "comments_set_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "on_profile_insert_generate_affiliate_code" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."generate_affiliate_code"();



CREATE OR REPLACE TRIGGER "on_redemption_created" AFTER INSERT ON "public"."redemption_history" FOR EACH ROW EXECUTE FUNCTION "public"."handle_redemption"();



CREATE OR REPLACE TRIGGER "on_stripe_webhook_received" AFTER INSERT ON "public"."stripe_webhooks" FOR EACH ROW EXECUTE FUNCTION "public"."handle_stripe_webhook"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "subscription_plans_set_updated_at" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "tr_generate_affiliate_code" BEFORE INSERT ON "public"."affiliates" FOR EACH ROW EXECUTE FUNCTION "public"."generate_affiliate_code"();



CREATE OR REPLACE TRIGGER "trg_ai_users_updated" BEFORE UPDATE ON "public"."ai_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ai_users_updated_at" BEFORE UPDATE ON "public"."ai_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_daily_checkins_updated_at" BEFORE UPDATE ON "public"."daily_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_referral_token" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_referral_token"();



CREATE OR REPLACE TRIGGER "update_daily_checkins_updated_at" BEFORE UPDATE ON "public"."daily_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_daily_checkins_updated_at_trigger" BEFORE UPDATE ON "public"."daily_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."update_daily_checkins_updated_at"();



CREATE OR REPLACE TRIGGER "update_gamification_updated_at" BEFORE UPDATE ON "public"."gamification" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_points_on_activity_insert" AFTER INSERT ON "public"."daily_activities" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_points_on_activity"();



CREATE OR REPLACE TRIGGER "update_resources_timestamp" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_training_plans_updated_at" BEFORE UPDATE ON "public"."user_training_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_training_plans_updated_at"();



ALTER TABLE ONLY "public"."affiliate_clicks"
    ADD CONSTRAINT "affiliate_clicks_code_fkey" FOREIGN KEY ("code") REFERENCES "public"."affiliate_links"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_commissions"
    ADD CONSTRAINT "affiliate_commissions_conversion_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "public"."affiliate_conversions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."affiliate_commissions"
    ADD CONSTRAINT "affiliate_commissions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_conversions"
    ADD CONSTRAINT "affiliate_conversions_code_fkey" FOREIGN KEY ("code") REFERENCES "public"."affiliate_links"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_conversions"
    ADD CONSTRAINT "affiliate_conversions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_events"
    ADD CONSTRAINT "ai_events_phone_fkey" FOREIGN KEY ("phone") REFERENCES "public"."ai_users"("phone") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_subscriptions"
    ADD CONSTRAINT "billing_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_user_state"
    ADD CONSTRAINT "coach_user_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_affiliate_code_fkey" FOREIGN KEY ("affiliate_code") REFERENCES "public"."affiliates"("code");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_activities"
    ADD CONSTRAINT "daily_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_metrics"
    ADD CONSTRAINT "daily_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_missions"
    ADD CONSTRAINT "daily_missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gamification"
    ADD CONSTRAINT "gamification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nutrition_plans"
    ADD CONSTRAINT "nutrition_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_requests"
    ADD CONSTRAINT "payout_requests_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."plan_days"
    ADD CONSTRAINT "plan_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."redemption_history"
    ADD CONSTRAINT "redemption_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_plans"
    ADD CONSTRAINT "training_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_code_fkey" FOREIGN KEY ("badge_code") REFERENCES "public"."badges"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_event_participation"
    ADD CONSTRAINT "user_event_participation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."gamification_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_event_participation"
    ADD CONSTRAINT "user_event_participation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_metrics"
    ADD CONSTRAINT "user_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_plans"
    ADD CONSTRAINT "user_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_training_plans"
    ADD CONSTRAINT "user_training_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin pode ver todos os logs" ON "public"."system_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Administrators can add logs for any user" ON "public"."system_logs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Administrators can view all logs" ON "public"."system_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admin to manage academies" ON "public"."academies" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admin to manage automations" ON "public"."automations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admin to manage integrations" ON "public"."integrations" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admin to manage plans" ON "public"."plans" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admin to manage rewards" ON "public"."rewards" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admin to manage settings" ON "public"."app_settings" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admins to insert redemptions" ON "public"."redemption_history" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admins to manage all affiliates" ON "public"."affiliates" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admins to manage all conversations" ON "public"."conversations" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admins to manage all payout requests" ON "public"."payout_requests" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow admins to manage all posts" ON "public"."community_posts" USING ("public"."is_admin"());



CREATE POLICY "Allow admins to view all integrations" ON "public"."user_integrations" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Allow admins to view all redemptions" ON "public"."redemption_history" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Allow admins to view all user metrics" ON "public"."user_metrics" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Allow authenticated users to insert their own metrics" ON "public"."user_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to manage plans" ON "public"."plans" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage rewards" ON "public"."rewards" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read active plans" ON "public"."plans" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Allow authenticated users to read active rewards" ON "public"."rewards" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Allow authenticated users to read all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read automations" ON "public"."automations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read their own metrics" ON "public"."user_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to update their own metrics" ON "public"."user_metrics" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow full access for service role" ON "public"."profiles" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow individual read access" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow individual update access" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow partners to manage their own payout requests" ON "public"."payout_requests" USING (("auth"."uid"() = "partner_id"));



CREATE POLICY "Allow partners to view affiliates" ON "public"."affiliates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'partner'::"text")))));



CREATE POLICY "Allow public read access on events" ON "public"."gamification_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on leaderboards" ON "public"."leaderboards" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on plans" ON "public"."plans" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on rewards" ON "public"."rewards" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to active affiliates" ON "public"."affiliates" FOR SELECT TO "authenticated", "anon" USING (("active" = true));



CREATE POLICY "Allow service_role to insert webhooks" ON "public"."stripe_webhooks" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow users to delete their own likes" ON "public"."post_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to delete their own posts" ON "public"."community_posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to insert their own conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to insert their own likes" ON "public"."post_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to insert their own posts" ON "public"."community_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to insert their own redemptions" ON "public"."redemption_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to manage their own integrations" ON "public"."user_integrations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to read all likes" ON "public"."post_likes" FOR SELECT USING (true);



CREATE POLICY "Allow users to read all posts" ON "public"."community_posts" FOR SELECT USING (true);



CREATE POLICY "Allow users to read their own conversations" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to update their own posts" ON "public"."community_posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to view their own redemptions" ON "public"."redemption_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."academies" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."affiliate_clicks" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."affiliate_commissions" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."affiliate_conversions" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."affiliate_links" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."ai_users" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."automations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."nutrition_plans" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."user_badges" FOR SELECT USING (true);



CREATE POLICY "Insert own profile" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Only administrators can delete logs" ON "public"."system_logs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Only administrators can update logs" ON "public"."system_logs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Only admins can view error logs" ON "public"."error_logs" FOR SELECT USING ((( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"text"))) IS NOT NULL));



COMMENT ON POLICY "Only admins can view error logs" ON "public"."error_logs" IS 'Restrict error log access to admin users only';



CREATE POLICY "Public read access" ON "public"."ai_coach_actions" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."ai_coach_settings" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."ai_nudges" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."habits" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."inbound_events" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."integrations_evolution" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."integrations_whatsapp" FOR SELECT USING (true);



CREATE POLICY "Public read habit logs" ON "public"."habit_logs" FOR SELECT USING (true);



CREATE POLICY "Read own profile" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Service role can create profiles" ON "public"."profiles" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage activity_tracking" ON "public"."activity_tracking" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage conversation_history" ON "public"."conversation_history" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage user_achievements" ON "public"."user_achievements" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage whatsapp_messages" ON "public"."whatsapp_messages" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."affiliates" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manage billing_subscriptions" ON "public"."billing_subscriptions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Serviços podem gerenciar logs" ON "public"."system_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "System can insert error logs" ON "public"."error_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Update own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can add their own logs" ON "public"."system_logs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own checkins" ON "public"."daily_checkins" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own training plans" ON "public"."user_training_plans" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own activities" ON "public"."daily_activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own checkins" ON "public"."daily_checkins" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own gamification" ON "public"."gamification" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own redemption history" ON "public"."redemption_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own training plans" ON "public"."user_training_plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own activities" ON "public"."daily_activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own checkins" ON "public"."daily_checkins" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own gamification" ON "public"."gamification" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own missions" ON "public"."daily_missions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own training plans" ON "public"."user_training_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view activity_tracking" ON "public"."activity_tracking" FOR SELECT USING (true);



CREATE POLICY "Users can view conversation_history" ON "public"."conversation_history" FOR SELECT USING (true);



CREATE POLICY "Users can view own activities" ON "public"."daily_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own checkins" ON "public"."daily_checkins" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own gamification" ON "public"."gamification" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own missions" ON "public"."daily_missions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own participation" ON "public"."user_event_participation" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own plans" ON "public"."user_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own redemption history" ON "public"."redemption_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referred_id")));



CREATE POLICY "Users can view own subscription" ON "public"."billing_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own training plans" ON "public"."user_training_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own logs" ON "public"."system_logs" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view user_achievements" ON "public"."user_achievements" FOR SELECT USING (true);



CREATE POLICY "Users can view whatsapp_messages" ON "public"."whatsapp_messages" FOR SELECT USING (true);



CREATE POLICY "Users own data" ON "public"."coach_user_state" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users own data" ON "public"."daily_metrics" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users own training plans" ON "public"."training_plans" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuarios podem atualizar seus próprios recursos" ON "public"."resources" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Usuarios podem excluir seus próprios recursos" ON "public"."resources" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Usuarios podem inserir seus próprios recursos" ON "public"."resources" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Usuarios podem visualizar seus próprios recursos ou recursos p" ON "public"."resources" FOR SELECT TO "authenticated" USING ("public"."auth_has_access_to_resource"("owner_id", "id", "permission"));



CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Usuários podem ver seu próprio perfil" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Usuários podem ver seus próprios perfis" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."academies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliate_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliate_commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliate_conversions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliate_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliates_select_all" ON "public"."affiliates" FOR SELECT USING (true);



ALTER TABLE "public"."ai_coach_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_coach_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_events_service" ON "public"."ai_events" USING (true) WITH CHECK (true);



ALTER TABLE "public"."ai_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_messages_service" ON "public"."ai_messages" USING (true) WITH CHECK (true);



CREATE POLICY "ai_messages_service_all" ON "public"."ai_messages" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."ai_nudges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_read" ON "public"."ai_settings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."ai_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_settings admin write" ON "public"."ai_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "ai_settings read" ON "public"."ai_settings" FOR SELECT USING (true);



ALTER TABLE "public"."ai_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_write_admin" ON "public"."ai_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_user_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_posts_public_read" ON "public"."community_posts" FOR SELECT USING (true);



ALTER TABLE "public"."conversation_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_missions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "emergency_access_user_profiles" ON "public"."user_profiles" USING (true) WITH CHECK (true);



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "error_logs_admin_only" ON "public"."error_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."gamification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gamification_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inbound_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations_evolution" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations_whatsapp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."measurements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "migrations_admin_only" ON "public"."supabase_migrations" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."nutrition_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "p_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "p_select_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "p_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."payout_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "perfil:owner read" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "perfil:owner write" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "perfil:self insert" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."plan_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_read_public" ON "public"."plans" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."points_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "public read plans" ON "public"."plans" FOR SELECT TO "anon" USING (true);



CREATE POLICY "public read rewards" ON "public"."rewards" FOR SELECT TO "anon" USING (true);



CREATE POLICY "public_read_plans" ON "public"."plans" FOR SELECT TO "anon" USING (true);



CREATE POLICY "public_read_rewards" ON "public"."rewards" FOR SELECT TO "anon" USING (true);



CREATE POLICY "read ai settings" ON "public"."ai_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "read_own_profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."redemption_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rewards_public_read" ON "public"."rewards" FOR SELECT USING (true);



CREATE POLICY "rewards_read_public" ON "public"."rewards" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "service_role_all_ai_conversations" ON "public"."ai_conversations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_all_ai_interactions" ON "public"."ai_interactions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_all_checkins" ON "public"."checkins" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_all_commissions" ON "public"."commissions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_all_measurements" ON "public"."measurements" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_all_plan_days" ON "public"."plan_days" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_all_points_ledger" ON "public"."points_ledger" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."stripe_webhooks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sub:owner read" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "sub:service write" ON "public"."subscriptions" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supabase_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own_profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "user can read own sub" ON "public"."billing_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_event_participation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_insert_policy" ON "public"."user_profiles" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "user_profiles_select_policy" ON "public"."user_profiles" FOR SELECT USING ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "user_profiles_update_policy" ON "public"."user_profiles" FOR UPDATE USING ((("auth"."uid"())::"text" = ("id")::"text")) WITH CHECK ((("auth"."uid"())::"text" = ("id")::"text"));



ALTER TABLE "public"."user_training_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_service_read" ON "public"."users" FOR SELECT TO "service_role" USING (true);



ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "webhook_logs_service_all" ON "public"."webhook_logs" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."whatsapp_messages" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("req" json) TO "anon";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("req" json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("req" json) TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid", "permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid", "permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_id" "uuid", "permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_owner" "uuid", "resource_id" "uuid", "permission_level" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_owner" "uuid", "resource_id" "uuid", "permission_level" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_has_access_to_resource"("resource_owner" "uuid", "resource_id" "uuid", "permission_level" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_bmi"("weight_kg" numeric, "height_cm" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_bmi"("weight_kg" numeric, "height_cm" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_bmi"("weight_kg" numeric, "height_cm" numeric) TO "service_role";



REVOKE ALL ON FUNCTION "public"."call_nudge_dispatcher"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."call_nudge_dispatcher"() TO "anon";
GRANT ALL ON FUNCTION "public"."call_nudge_dispatcher"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_nudge_dispatcher"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_subscription_expiry"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_subscription_expiry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_subscription_expiry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_access"("resource_id" "uuid", "required_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_access"("resource_id" "uuid", "required_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_access"("resource_id" "uuid", "required_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_gamification_for_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_gamification_for_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_gamification_for_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."create_gamification_for_user"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."create_user_profile_on_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile_on_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile_on_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_referral_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_referral_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_referral_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_affiliate_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_affiliate_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_affiliate_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_missions_for_user"("p_user_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_missions_for_user"("p_user_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_missions_for_user"("p_user_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_user"("auth_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_user"("auth_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_user"("auth_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v1"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v1"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v1"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v2"("partner_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v2"("partner_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v2"("partner_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v3"("partner_id" "uuid", "start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v3"("partner_id" "uuid", "start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data_v3"("partner_id" "uuid", "start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_subscription_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."grant_subscription_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_subscription_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_test"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_test"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_test"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_test"("user_id" "uuid", "email" "text", "meta_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_test"("user_id" "uuid", "email" "text", "meta_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_test"("user_id" "uuid", "email" "text", "meta_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_redemption"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_redemption"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_redemption"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stripe_webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stripe_webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stripe_webhook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_error"("error_message" "text", "error_details" "jsonb", "severity" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_error"("error_message" "text", "error_details" "jsonb", "severity" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_error"("error_message" "text", "error_details" "jsonb", "severity" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_info"("event_name" "text", "event_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_info"("event_name" "text", "event_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_info"("event_name" "text", "event_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_system_event"("event_type" "text", "event_data" json) TO "anon";
GRANT ALL ON FUNCTION "public"."log_system_event"("event_type" "text", "event_data" json) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_system_event"("event_type" "text", "event_data" json) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_system_event"("event_type" "text", "details" "jsonb", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."log_system_event"("event_type" "text", "details" "jsonb", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_system_event"("event_type" "text", "details" "jsonb", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_system_event"("p_event_type" "text", "p_message" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_system_event"("p_event_type" "text", "p_message" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_system_event"("p_event_type" "text", "p_message" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."logged_function_example"("param1" "text", "param2" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."logged_function_example"("param1" "text", "param2" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."logged_function_example"("param1" "text", "param2" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."maintain_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."maintain_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."maintain_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_auth_user_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_auth_user_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_auth_user_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_affiliate_commission"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_affiliate_commission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_affiliate_commission"() TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."user_profiles" TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."safe_upsert_user_profile"("p_user_id" "uuid", "p_full_name" "text", "p_name" "text", "p_email" "text", "p_phone" character varying, "p_age" integer, "p_height" integer, "p_current_weight" numeric, "p_target_weight" numeric, "p_gender" character varying, "p_activity_level" character varying, "p_goal_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."safe_upsert_user_profile"("p_user_id" "uuid", "p_full_name" "text", "p_name" "text", "p_email" "text", "p_phone" character varying, "p_age" integer, "p_height" integer, "p_current_weight" numeric, "p_target_weight" numeric, "p_gender" character varying, "p_activity_level" character varying, "p_goal_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_upsert_user_profile"("p_user_id" "uuid", "p_full_name" "text", "p_name" "text", "p_email" "text", "p_phone" character varying, "p_age" integer, "p_height" integer, "p_current_weight" numeric, "p_target_weight" numeric, "p_gender" character varying, "p_activity_level" character varying, "p_goal_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_records"("search_term" "text", "category" "text", "max_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_records"("search_term" "text", "category" "text", "max_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_records"("search_term" "text", "category" "text", "max_results" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."secure_resource_access"("resource_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."secure_resource_access"("resource_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."secure_resource_access"("resource_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."secure_resource_access"("resource_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_auth_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_auth_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_auth_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_complete_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_complete_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_complete_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_handle_new_user"("user_id_param" "uuid", "email_param" "text", "name_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."test_handle_new_user"("user_id_param" "uuid", "email_param" "text", "name_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_handle_new_user"("user_id_param" "uuid", "email_param" "text", "name_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_profile_creation"("user_id" "uuid", "user_email" "text", "user_phone" "text", "user_meta" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."test_profile_creation"("user_id" "uuid", "user_email" "text", "user_phone" "text", "user_meta" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_profile_creation"("user_id" "uuid", "user_email" "text", "user_phone" "text", "user_meta" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_query_performance"("query_text" "text", "num_executions" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."test_query_performance"("query_text" "text", "num_executions" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_query_performance"("query_text" "text", "num_executions" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_points_on_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_points_on_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_points_on_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_daily_checkins_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_checkins_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_checkins_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_gamification"("p_user_id" "uuid", "p_points_to_add" integer, "p_activity_type" "text", "p_is_bonus" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_gamification"("p_user_id" "uuid", "p_points_to_add" integer, "p_activity_type" "text", "p_is_bonus" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_gamification"("p_user_id" "uuid", "p_points_to_add" integer, "p_activity_type" "text", "p_is_bonus" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_training_plans_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_training_plans_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_training_plans_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."academies" TO "anon";
GRANT ALL ON TABLE "public"."academies" TO "authenticated";
GRANT ALL ON TABLE "public"."academies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."academies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."academies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."academies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."accessible_resources" TO "anon";
GRANT ALL ON TABLE "public"."accessible_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."accessible_resources" TO "service_role";



GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."activity_tracking" TO "anon";
GRANT ALL ON TABLE "public"."activity_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_clicks" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_clicks" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_clicks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."affiliate_clicks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."affiliate_clicks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."affiliate_clicks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_commissions" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_commissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."affiliate_commissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."affiliate_commissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."affiliate_commissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_conversions" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_conversions" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_conversions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."affiliate_conversions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."affiliate_conversions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."affiliate_conversions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_links" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_links" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_links" TO "service_role";



GRANT ALL ON TABLE "public"."affiliates" TO "anon";
GRANT ALL ON TABLE "public"."affiliates" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliates" TO "service_role";



GRANT ALL ON TABLE "public"."ai_coach_actions" TO "anon";
GRANT ALL ON TABLE "public"."ai_coach_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_coach_actions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_coach_settings" TO "anon";
GRANT ALL ON TABLE "public"."ai_coach_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_coach_settings" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_events" TO "anon";
GRANT ALL ON TABLE "public"."ai_events" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_interactions" TO "anon";
GRANT ALL ON TABLE "public"."ai_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_interactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_interactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_interactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_interactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_nudges" TO "anon";
GRANT ALL ON TABLE "public"."ai_nudges" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_nudges" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_nudges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_nudges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_nudges_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_settings" TO "anon";
GRANT ALL ON TABLE "public"."ai_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_users" TO "anon";
GRANT ALL ON TABLE "public"."ai_users" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_users" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."automations" TO "anon";
GRANT ALL ON TABLE "public"."automations" TO "authenticated";
GRANT ALL ON TABLE "public"."automations" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."billing_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."billing_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."checkins" TO "anon";
GRANT ALL ON TABLE "public"."checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."checkins" TO "service_role";



GRANT ALL ON TABLE "public"."coach_user_state" TO "anon";
GRANT ALL ON TABLE "public"."coach_user_state" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_user_state" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."commissions" TO "anon";
GRANT ALL ON TABLE "public"."commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."commissions" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."community_feed" TO "anon";
GRANT ALL ON TABLE "public"."community_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."community_feed" TO "service_role";



GRANT ALL ON TABLE "public"."comunidade" TO "anon";
GRANT ALL ON TABLE "public"."comunidade" TO "authenticated";
GRANT ALL ON TABLE "public"."comunidade" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_history" TO "anon";
GRANT ALL ON TABLE "public"."conversation_history" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_history" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."daily_activities" TO "anon";
GRANT ALL ON TABLE "public"."daily_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_activities" TO "service_role";



GRANT ALL ON TABLE "public"."daily_checkins" TO "anon";
GRANT ALL ON TABLE "public"."daily_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."daily_metrics" TO "anon";
GRANT ALL ON TABLE "public"."daily_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."daily_missions" TO "anon";
GRANT ALL ON TABLE "public"."daily_missions" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_missions" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."error_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."error_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."error_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."gamification" TO "anon";
GRANT ALL ON TABLE "public"."gamification" TO "authenticated";
GRANT ALL ON TABLE "public"."gamification" TO "service_role";
GRANT ALL ON TABLE "public"."gamification" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."gamification_events" TO "anon";
GRANT ALL ON TABLE "public"."gamification_events" TO "authenticated";
GRANT ALL ON TABLE "public"."gamification_events" TO "service_role";



GRANT ALL ON TABLE "public"."habit_logs" TO "anon";
GRANT ALL ON TABLE "public"."habit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



GRANT ALL ON TABLE "public"."inbound_events" TO "anon";
GRANT ALL ON TABLE "public"."inbound_events" TO "authenticated";
GRANT ALL ON TABLE "public"."inbound_events" TO "service_role";



GRANT ALL ON TABLE "public"."integrations" TO "anon";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations" TO "service_role";



GRANT ALL ON TABLE "public"."integrations_evolution" TO "anon";
GRANT ALL ON TABLE "public"."integrations_evolution" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations_evolution" TO "service_role";



GRANT ALL ON SEQUENCE "public"."integrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."integrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."integrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."integrations_whatsapp" TO "anon";
GRANT ALL ON TABLE "public"."integrations_whatsapp" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations_whatsapp" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboards" TO "anon";
GRANT ALL ON TABLE "public"."leaderboards" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboards" TO "service_role";



GRANT ALL ON TABLE "public"."measurements" TO "anon";
GRANT ALL ON TABLE "public"."measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."measurements" TO "service_role";



GRANT ALL ON TABLE "public"."nutrition_plans" TO "anon";
GRANT ALL ON TABLE "public"."nutrition_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrition_plans" TO "service_role";



GRANT ALL ON TABLE "public"."payout_requests" TO "anon";
GRANT ALL ON TABLE "public"."payout_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_requests" TO "service_role";



GRANT ALL ON TABLE "public"."plan_days" TO "anon";
GRANT ALL ON TABLE "public"."plan_days" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_days" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."plans_normalized" TO "anon";
GRANT ALL ON TABLE "public"."plans_normalized" TO "authenticated";
GRANT ALL ON TABLE "public"."plans_normalized" TO "service_role";



GRANT ALL ON TABLE "public"."points_ledger" TO "anon";
GRANT ALL ON TABLE "public"."points_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."points_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."recompensas" TO "anon";
GRANT ALL ON TABLE "public"."recompensas" TO "authenticated";
GRANT ALL ON TABLE "public"."recompensas" TO "service_role";



GRANT ALL ON TABLE "public"."redemption_history" TO "anon";
GRANT ALL ON TABLE "public"."redemption_history" TO "authenticated";
GRANT ALL ON TABLE "public"."redemption_history" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rewards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rewards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rewards_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_events" TO "anon";
GRANT ALL ON TABLE "public"."stripe_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_events" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."stripe_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_webhooks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_webhooks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_webhooks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_webhooks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."supabase_migrations" TO "anon";
GRANT ALL ON TABLE "public"."supabase_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."supabase_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."system_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."system_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."system_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."system_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."training_plans" TO "anon";
GRANT ALL ON TABLE "public"."training_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."training_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_event_participation" TO "anon";
GRANT ALL ON TABLE "public"."user_event_participation" TO "authenticated";
GRANT ALL ON TABLE "public"."user_event_participation" TO "service_role";



GRANT ALL ON TABLE "public"."user_integrations" TO "anon";
GRANT ALL ON TABLE "public"."user_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_metrics" TO "anon";
GRANT ALL ON TABLE "public"."user_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."user_plans" TO "anon";
GRANT ALL ON TABLE "public"."user_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."user_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_training_plans" TO "anon";
GRANT ALL ON TABLE "public"."user_training_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."user_training_plans" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_client_progress" TO "anon";
GRANT ALL ON TABLE "public"."v_client_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."v_client_progress" TO "service_role";



GRANT ALL ON TABLE "public"."v_partner_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."v_partner_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_partner_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_gamification_log" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_gamification_log" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_gamification_log" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_messages" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
