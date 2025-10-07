-- Migration replacement para corrigir problemas de idempotência
-- Esta migração substitui a 20250909153828_sync_migration_fix.sql problemática

-- Wrapping everything in a DO block for better error handling
DO $$ 
BEGIN
    -- Create schema if not exists
    CREATE SCHEMA IF NOT EXISTS "private";
    
    -- Create tables if not exist
    CREATE TABLE IF NOT EXISTS "private"."auth_attempts" (
        "id" uuid not null default gen_random_uuid(),
        "email" text not null,
        "ip_address" text not null,
        "attempted_at" timestamp with time zone not null default now(),
        "success" boolean not null default false
    );

    CREATE TABLE IF NOT EXISTS "private"."function_execution_log" (
        "id" uuid not null default gen_random_uuid(),
        "function_name" text not null,
        "user_id" uuid,
        "execution_time" timestamp with time zone default now(),
        "parameters" jsonb,
        "success" boolean,
        "error_message" text
    );

    -- Create indexes if not exist (using exception handling)
    BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS auth_attempts_pkey ON private.auth_attempts USING btree (id);
    EXCEPTION WHEN duplicate_table THEN
        -- Index already exists, ignore
    END;

    BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS function_execution_log_pkey ON private.function_execution_log USING btree (id);
    EXCEPTION WHEN duplicate_table THEN
        -- Index already exists, ignore
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_email ON private.auth_attempts USING btree (ip_address, email, attempted_at);
    EXCEPTION WHEN duplicate_table THEN
        -- Index already exists, ignore
    END;

    -- Add primary key constraints if not exist
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auth_attempts_pkey') THEN
            ALTER TABLE "private"."auth_attempts" ADD CONSTRAINT "auth_attempts_pkey" PRIMARY KEY USING INDEX "auth_attempts_pkey";
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Constraint might already exist or index might not exist, continue
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'function_execution_log_pkey') THEN
            ALTER TABLE "private"."function_execution_log" ADD CONSTRAINT "function_execution_log_pkey" PRIMARY KEY USING INDEX "function_execution_log_pkey";
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Constraint might already exist or index might not exist, continue
    END;

END $$;

-- Enable function body checking
SET check_function_bodies = off;

-- Create core functions with OR REPLACE to make them idempotent
CREATE OR REPLACE FUNCTION private.check_auth_rate_limit(p_email text, p_ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  attempt_count INT;
BEGIN
  -- Count recent attempts from this IP
  SELECT COUNT(*) INTO attempt_count
  FROM private.auth_attempts
  WHERE ip_address = p_ip_address
    AND attempted_at > (now() - interval '1 hour');
    
  -- Return false if too many attempts
  RETURN attempt_count <= 10;
END;
$function$;

CREATE OR REPLACE FUNCTION private.check_reset_attempt(p_email text, p_ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  attempt_count INT;
BEGIN
  -- Log this attempt
  INSERT INTO private.auth_attempts (email, ip_address)
  VALUES (p_email, p_ip_address);
  
  -- Count recent attempts from this IP
  SELECT COUNT(*) INTO attempt_count
  FROM private.auth_attempts
  WHERE ip_address = p_ip_address
    AND attempted_at > (now() - interval '1 hour');
    
  -- Return false if too many attempts
  RETURN attempt_count <= 10;
END;
$function$;

-- Create view (will replace if exists)
CREATE OR REPLACE VIEW "private"."suspicious_auth_activity" AS 
SELECT ip_address,
    count(*) AS attempt_count,
    array_agg(DISTINCT email) AS targeted_emails,
    min(attempted_at) AS first_attempt,
    max(attempted_at) AS last_attempt
FROM private.auth_attempts
WHERE (attempted_at > (now() - '24:00:00'::interval))
GROUP BY ip_address
HAVING (count(*) > 20)
ORDER BY (count(*)) DESC;

-- Essential core functions for system operation
CREATE OR REPLACE FUNCTION public.get_auth_user()
RETURNS uuid
LANGUAGE sql
AS $function$
    SELECT auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.create_user_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create triggers only if they don't exist
DO $$
BEGIN
    -- Check if trigger exists before creating
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.create_user_profile_on_signup();
    END IF;
END $$;