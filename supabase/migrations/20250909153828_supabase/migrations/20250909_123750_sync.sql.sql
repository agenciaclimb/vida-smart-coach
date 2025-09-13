create schema if not exists "private";

create table "private"."auth_attempts" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "ip_address" text not null,
    "attempted_at" timestamp with time zone not null default now(),
    "success" boolean not null default false
);


create table "private"."function_execution_log" (
    "id" uuid not null default gen_random_uuid(),
    "function_name" text not null,
    "user_id" uuid,
    "execution_time" timestamp with time zone default now(),
    "parameters" jsonb,
    "success" boolean,
    "error_message" text
);


CREATE UNIQUE INDEX auth_attempts_pkey ON private.auth_attempts USING btree (id);

CREATE UNIQUE INDEX function_execution_log_pkey ON private.function_execution_log USING btree (id);

CREATE INDEX idx_auth_attempts_ip_email ON private.auth_attempts USING btree (ip_address, email, attempted_at);

alter table "private"."auth_attempts" add constraint "auth_attempts_pkey" PRIMARY KEY using index "auth_attempts_pkey";

alter table "private"."function_execution_log" add constraint "function_execution_log_pkey" PRIMARY KEY using index "function_execution_log_pkey";

set check_function_bodies = off;

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
$function$
;

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
$function$
;

create or replace view "private"."suspicious_auth_activity" as  SELECT ip_address,
    count(*) AS attempt_count,
    array_agg(DISTINCT email) AS targeted_emails,
    min(attempted_at) AS first_attempt,
    max(attempted_at) AS last_attempt
   FROM private.auth_attempts
  WHERE (attempted_at > (now() - '24:00:00'::interval))
  GROUP BY ip_address
 HAVING (count(*) > 20)
  ORDER BY (count(*)) DESC;



create sequence "public"."academies_id_seq";

create sequence "public"."affiliate_clicks_id_seq";

create sequence "public"."affiliate_commissions_id_seq";

create sequence "public"."affiliate_conversions_id_seq";

create sequence "public"."ai_events_id_seq";

create sequence "public"."ai_interactions_id_seq";

create sequence "public"."ai_messages_id_seq";

create sequence "public"."ai_nudges_id_seq";

create sequence "public"."ai_settings_id_seq";

create sequence "public"."error_logs_id_seq";

create sequence "public"."rewards_id_seq";

create sequence "public"."stripe_webhooks_id_seq";

drop trigger if exists "create_gamification_on_user_creation" on "public"."user_profiles";

revoke delete on table "public"."daily_checkins" from "anon";

revoke insert on table "public"."daily_checkins" from "anon";

revoke references on table "public"."daily_checkins" from "anon";

revoke select on table "public"."daily_checkins" from "anon";

revoke trigger on table "public"."daily_checkins" from "anon";

revoke truncate on table "public"."daily_checkins" from "anon";

revoke update on table "public"."daily_checkins" from "anon";

revoke delete on table "public"."daily_checkins" from "authenticated";

revoke insert on table "public"."daily_checkins" from "authenticated";

revoke references on table "public"."daily_checkins" from "authenticated";

revoke select on table "public"."daily_checkins" from "authenticated";

revoke trigger on table "public"."daily_checkins" from "authenticated";

revoke truncate on table "public"."daily_checkins" from "authenticated";

revoke update on table "public"."daily_checkins" from "authenticated";

revoke delete on table "public"."daily_checkins" from "service_role";

revoke insert on table "public"."daily_checkins" from "service_role";

revoke references on table "public"."daily_checkins" from "service_role";

revoke select on table "public"."daily_checkins" from "service_role";

revoke trigger on table "public"."daily_checkins" from "service_role";

revoke truncate on table "public"."daily_checkins" from "service_role";

revoke update on table "public"."daily_checkins" from "service_role";

revoke delete on table "public"."gamification" from "anon";

revoke insert on table "public"."gamification" from "anon";

revoke references on table "public"."gamification" from "anon";

revoke select on table "public"."gamification" from "anon";

revoke trigger on table "public"."gamification" from "anon";

revoke truncate on table "public"."gamification" from "anon";

revoke update on table "public"."gamification" from "anon";

revoke delete on table "public"."gamification" from "authenticated";

revoke insert on table "public"."gamification" from "authenticated";

revoke references on table "public"."gamification" from "authenticated";

revoke select on table "public"."gamification" from "authenticated";

revoke trigger on table "public"."gamification" from "authenticated";

revoke truncate on table "public"."gamification" from "authenticated";

revoke update on table "public"."gamification" from "authenticated";

revoke delete on table "public"."gamification" from "service_role";

revoke insert on table "public"."gamification" from "service_role";

revoke references on table "public"."gamification" from "service_role";

revoke select on table "public"."gamification" from "service_role";

revoke trigger on table "public"."gamification" from "service_role";

revoke truncate on table "public"."gamification" from "service_role";

revoke update on table "public"."gamification" from "service_role";

revoke delete on table "public"."plans" from "anon";

revoke insert on table "public"."plans" from "anon";

revoke references on table "public"."plans" from "anon";

revoke select on table "public"."plans" from "anon";

revoke trigger on table "public"."plans" from "anon";

revoke truncate on table "public"."plans" from "anon";

revoke update on table "public"."plans" from "anon";

revoke delete on table "public"."plans" from "authenticated";

revoke insert on table "public"."plans" from "authenticated";

revoke references on table "public"."plans" from "authenticated";

revoke select on table "public"."plans" from "authenticated";

revoke trigger on table "public"."plans" from "authenticated";

revoke truncate on table "public"."plans" from "authenticated";

revoke update on table "public"."plans" from "authenticated";

revoke delete on table "public"."plans" from "service_role";

revoke insert on table "public"."plans" from "service_role";

revoke references on table "public"."plans" from "service_role";

revoke select on table "public"."plans" from "service_role";

revoke trigger on table "public"."plans" from "service_role";

revoke truncate on table "public"."plans" from "service_role";

revoke update on table "public"."plans" from "service_role";

revoke delete on table "public"."rewards" from "anon";

revoke insert on table "public"."rewards" from "anon";

revoke references on table "public"."rewards" from "anon";

revoke select on table "public"."rewards" from "anon";

revoke trigger on table "public"."rewards" from "anon";

revoke truncate on table "public"."rewards" from "anon";

revoke update on table "public"."rewards" from "anon";

revoke delete on table "public"."rewards" from "authenticated";

revoke insert on table "public"."rewards" from "authenticated";

revoke references on table "public"."rewards" from "authenticated";

revoke select on table "public"."rewards" from "authenticated";

revoke trigger on table "public"."rewards" from "authenticated";

revoke truncate on table "public"."rewards" from "authenticated";

revoke update on table "public"."rewards" from "authenticated";

revoke delete on table "public"."rewards" from "service_role";

revoke insert on table "public"."rewards" from "service_role";

revoke references on table "public"."rewards" from "service_role";

revoke select on table "public"."rewards" from "service_role";

revoke trigger on table "public"."rewards" from "service_role";

revoke truncate on table "public"."rewards" from "service_role";

revoke update on table "public"."rewards" from "service_role";

revoke delete on table "public"."user_profiles" from "anon";

revoke insert on table "public"."user_profiles" from "anon";

revoke references on table "public"."user_profiles" from "anon";

revoke select on table "public"."user_profiles" from "anon";

revoke trigger on table "public"."user_profiles" from "anon";

revoke truncate on table "public"."user_profiles" from "anon";

revoke update on table "public"."user_profiles" from "anon";

revoke delete on table "public"."user_profiles" from "authenticated";

revoke insert on table "public"."user_profiles" from "authenticated";

revoke references on table "public"."user_profiles" from "authenticated";

revoke select on table "public"."user_profiles" from "authenticated";

revoke trigger on table "public"."user_profiles" from "authenticated";

revoke truncate on table "public"."user_profiles" from "authenticated";

revoke update on table "public"."user_profiles" from "authenticated";

revoke delete on table "public"."user_profiles" from "service_role";

revoke insert on table "public"."user_profiles" from "service_role";

revoke references on table "public"."user_profiles" from "service_role";

revoke select on table "public"."user_profiles" from "service_role";

revoke trigger on table "public"."user_profiles" from "service_role";

revoke truncate on table "public"."user_profiles" from "service_role";

revoke update on table "public"."user_profiles" from "service_role";

revoke delete on table "public"."user_profiles" from "supabase_auth_admin";

revoke insert on table "public"."user_profiles" from "supabase_auth_admin";

revoke references on table "public"."user_profiles" from "supabase_auth_admin";

revoke select on table "public"."user_profiles" from "supabase_auth_admin";

revoke trigger on table "public"."user_profiles" from "supabase_auth_admin";

revoke truncate on table "public"."user_profiles" from "supabase_auth_admin";

revoke update on table "public"."user_profiles" from "supabase_auth_admin";

revoke delete on table "public"."whatsapp_messages" from "anon";

revoke insert on table "public"."whatsapp_messages" from "anon";

revoke references on table "public"."whatsapp_messages" from "anon";

revoke select on table "public"."whatsapp_messages" from "anon";

revoke trigger on table "public"."whatsapp_messages" from "anon";

revoke truncate on table "public"."whatsapp_messages" from "anon";

revoke update on table "public"."whatsapp_messages" from "anon";

revoke delete on table "public"."whatsapp_messages" from "authenticated";

revoke insert on table "public"."whatsapp_messages" from "authenticated";

revoke references on table "public"."whatsapp_messages" from "authenticated";

revoke select on table "public"."whatsapp_messages" from "authenticated";

revoke trigger on table "public"."whatsapp_messages" from "authenticated";

revoke truncate on table "public"."whatsapp_messages" from "authenticated";

revoke update on table "public"."whatsapp_messages" from "authenticated";

revoke delete on table "public"."whatsapp_messages" from "service_role";

revoke insert on table "public"."whatsapp_messages" from "service_role";

revoke references on table "public"."whatsapp_messages" from "service_role";

revoke select on table "public"."whatsapp_messages" from "service_role";

revoke trigger on table "public"."whatsapp_messages" from "service_role";

revoke truncate on table "public"."whatsapp_messages" from "service_role";

revoke update on table "public"."whatsapp_messages" from "service_role";

alter table "public"."user_profiles" drop constraint "user_profiles_role_check";

drop function if exists "public"."create_gamification_for_auth_user"();

create table "public"."academies" (
    "id" integer not null default nextval('academies_id_seq'::regclass),
    "name" text not null,
    "logo" text,
    "clients" integer default 0,
    "status" text default 'active'::text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."academies" enable row level security;

create table "public"."activity_tracking" (
    "id" uuid not null default gen_random_uuid(),
    "phone_number" text not null,
    "activity_type" text not null,
    "activity_name" text not null,
    "points_earned" integer default 0,
    "completed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."activity_tracking" enable row level security;

create table "public"."affiliate_clicks" (
    "id" bigint not null default nextval('affiliate_clicks_id_seq'::regclass),
    "code" text,
    "clicked_at" timestamp with time zone default now(),
    "ip" text,
    "ua" text
);


alter table "public"."affiliate_clicks" enable row level security;

create table "public"."affiliate_commissions" (
    "id" bigint not null default nextval('affiliate_commissions_id_seq'::regclass),
    "partner_id" uuid,
    "conversion_id" bigint,
    "amount_cents" integer not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "paid_at" timestamp with time zone
);


alter table "public"."affiliate_commissions" enable row level security;

create table "public"."affiliate_conversions" (
    "id" bigint not null default nextval('affiliate_conversions_id_seq'::regclass),
    "code" text,
    "user_id" uuid,
    "plan" text,
    "amount_cents" integer,
    "occurred_at" timestamp with time zone default now()
);


alter table "public"."affiliate_conversions" enable row level security;

create table "public"."affiliate_links" (
    "code" text not null,
    "partner_id" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."affiliate_links" enable row level security;

create table "public"."affiliates" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "display_name" text,
    "percent" numeric default 0.30,
    "active" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."affiliates" enable row level security;

create table "public"."ai_coach_actions" (
    "action_name" text not null,
    "enabled" boolean not null default true,
    "params" jsonb not null default '{}'::jsonb,
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."ai_coach_actions" enable row level security;

create table "public"."ai_coach_settings" (
    "id" integer not null,
    "system_prompt" text not null,
    "opening_message" text default 'Olá! Como posso te ajudar hoje? 😊'::text,
    "tone" text default 'objetivo e acolhedor'::text,
    "max_questions" integer default 1,
    "use_emojis" boolean default true,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ai_coach_settings" enable row level security;

create table "public"."ai_conversations" (
    "phone" text not null,
    "step" text not null default 'start'::text,
    "data" jsonb not null default '{}'::jsonb,
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."ai_conversations" enable row level security;

create table "public"."ai_events" (
    "id" bigint not null default nextval('ai_events_id_seq'::regclass),
    "phone" text not null,
    "type" text not null,
    "payload" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."ai_events" enable row level security;

create table "public"."ai_interactions" (
    "id" bigint not null default nextval('ai_interactions_id_seq'::regclass),
    "phone" text not null,
    "role" text not null,
    "content" text not null,
    "meta" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."ai_interactions" enable row level security;

create table "public"."ai_messages" (
    "id" bigint not null default nextval('ai_messages_id_seq'::regclass),
    "phone" text not null,
    "role" text not null default 'user'::text,
    "text" text not null,
    "meta" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "direction" text default 'in'::text
);


alter table "public"."ai_messages" enable row level security;

create table "public"."ai_nudges" (
    "id" bigint not null default nextval('ai_nudges_id_seq'::regclass),
    "phone" text not null,
    "text" text not null,
    "scheduled_at" timestamp with time zone not null,
    "sent_at" timestamp with time zone,
    "status" text not null default 'pending'::text,
    "tries" integer not null default 0,
    "meta" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."ai_nudges" enable row level security;

create table "public"."ai_settings" (
    "id" bigint not null default nextval('ai_settings_id_seq'::regclass),
    "key" text not null,
    "content" text not null,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ai_settings" enable row level security;

create table "public"."ai_users" (
    "phone" text not null,
    "goal" text,
    "next_action" text,
    "last_plan_generated_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "reminder_opt_in" boolean default false,
    "reminder_time" text,
    "motivation_opt_in" boolean default false,
    "style" text,
    "first_name" text,
    "name" text,
    "wants_reminders" boolean default false,
    "wants_quotes" boolean default false,
    "stage" text default 'new'::text,
    "training_place" text,
    "display_name" text,
    "first_seen_at" timestamp with time zone default now(),
    "interactions" integer default 0,
    "checkins_ok" integer default 0,
    "plan_sent_at" timestamp with time zone,
    "upgrade_offered_at" timestamp with time zone,
    "referral_offered_at" timestamp with time zone,
    "reminders_on" boolean default false,
    "referral_token" text,
    "train_pref" text,
    "days_per_week" integer,
    "minutes_per_session" integer,
    "level" text,
    "equipment" text,
    "train_time" text,
    "pain_limitations" text,
    "motivation_style" text,
    "spiritual_opt_in" boolean default false,
    "weight_kg" numeric,
    "height_cm" numeric,
    "bodyfat_pct" numeric,
    "waist_cm" numeric,
    "hip_cm" numeric,
    "train_days_per_week" integer,
    "minutes_per_day" integer,
    "train_context" text,
    "sleep_focus" boolean default false,
    "diet_pref" text default 'onivoro'::text,
    "context" jsonb default '{}'::jsonb,
    "plan_fail_at" timestamp with time zone,
    "weight" numeric,
    "height" numeric,
    "missing" jsonb default '{}'::jsonb,
    "user_id" uuid,
    "step" text default 'discovery'::text,
    "last_question_id" text,
    "attempt_count" integer default 0,
    "last_ask" timestamp with time zone,
    "welcomed_at" timestamp with time zone,
    "last_step_sent_at" timestamp with time zone,
    "last_bot_sig" text,
    "last_user_msg_at" timestamp with time zone,
    "last_bot" text,
    "last_user" text,
    "last_user_hash" text,
    "last_user_at" timestamp with time zone,
    "state" text,
    "last_ask_at" timestamp with time zone,
    "last_ai" text,
    "last_ai_at" timestamp with time zone,
    "persona_json" jsonb,
    "context_json" jsonb,
    "plan_summary" text,
    "cooldown_until" timestamp with time zone
);


alter table "public"."ai_users" enable row level security;

create table "public"."app_settings" (
    "key" text not null,
    "value" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "id" text,
    "ai_system_prompt" text,
    "ai_system_prompt_full" text
);


alter table "public"."app_settings" enable row level security;

create table "public"."automations" (
    "id" text not null,
    "title" text not null,
    "description" text,
    "is_active" boolean not null default true,
    "icon" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."automations" enable row level security;

create table "public"."badges" (
    "code" text not null,
    "name" text not null,
    "description" text not null
);


alter table "public"."badges" enable row level security;

create table "public"."checkins" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text not null,
    "day" date not null,
    "completed" boolean default false,
    "mood" integer,
    "sleep_hours" numeric,
    "notes" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."checkins" enable row level security;

create table "public"."coach_user_state" (
    "user_id" uuid not null,
    "goal" text,
    "training_lvl" text,
    "diet_notes" text,
    "sleep_notes" text,
    "last_summary" text,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."coach_user_state" enable row level security;

create table "public"."commissions" (
    "id" uuid not null default gen_random_uuid(),
    "affiliate_code" text not null,
    "user_id" uuid,
    "amount_cents" integer not null,
    "status" text default 'pending'::text,
    "period_month" date,
    "created_at" timestamp with time zone default now()
);


alter table "public"."commissions" enable row level security;

create table "public"."community_posts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "content" text not null,
    "likes" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."community_posts" enable row level security;

create table "public"."conversation_history" (
    "id" uuid not null default gen_random_uuid(),
    "phone_number" text not null,
    "message_type" text not null,
    "message_content" text not null,
    "sentiment_score" numeric(3,2) default 0.0,
    "topics" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."conversation_history" enable row level security;

create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid,
    "role" text,
    "content" text,
    "message_id" text
);


alter table "public"."conversations" enable row level security;

create table "public"."daily_metrics" (
    "user_id" uuid not null,
    "day" date not null,
    "weight_kg" numeric(5,2),
    "steps" integer,
    "workouts" integer,
    "sleep_hours" numeric(4,2)
);


alter table "public"."daily_metrics" enable row level security;

create table "public"."error_logs" (
    "id" bigint not null default nextval('error_logs_id_seq'::regclass),
    "context" text,
    "details" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."habit_logs" (
    "habit_id" uuid not null,
    "day" date not null,
    "done" boolean not null default false
);


alter table "public"."habit_logs" enable row level security;

create table "public"."habits" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "schedule" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."habits" enable row level security;

create table "public"."inbound_events" (
    "id" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."inbound_events" enable row level security;

create table "public"."integrations" (
    "id" bigint generated by default as identity not null,
    "service" text not null,
    "credentials" jsonb not null,
    "is_connected" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."integrations" enable row level security;

create table "public"."integrations_evolution" (
    "id" integer not null default 1,
    "token" text not null,
    "instancename" text not null,
    "updated_at" timestamp with time zone default now(),
    "instanceid" text
);


alter table "public"."integrations_evolution" enable row level security;

create table "public"."integrations_whatsapp" (
    "id" uuid not null default gen_random_uuid(),
    "instance_name" text not null,
    "token" text,
    "status" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "provider" text not null default 'evolution_api'::text
);


alter table "public"."integrations_whatsapp" enable row level security;

create table "public"."measurements" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text not null,
    "taken_at" date not null default CURRENT_DATE,
    "weight_kg" numeric,
    "height_cm" numeric,
    "bodyfat_pct" numeric,
    "waist_cm" numeric,
    "hip_cm" numeric,
    "notes" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."measurements" enable row level security;

create table "public"."nutrition_plans" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "plan" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."nutrition_plans" enable row level security;

create table "public"."payout_requests" (
    "id" uuid not null default gen_random_uuid(),
    "partner_id" uuid not null,
    "amount" numeric(10,2) not null,
    "pix_key" text not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "notes" text
);


alter table "public"."payout_requests" enable row level security;

create table "public"."plan_days" (
    "id" uuid not null default gen_random_uuid(),
    "plan_id" uuid,
    "day_index" integer not null,
    "focus" text,
    "workout" jsonb,
    "habit" jsonb,
    "nutrition" jsonb,
    "sleep" jsonb,
    "minutes" integer,
    "created_at" timestamp with time zone default now()
);


alter table "public"."plan_days" enable row level security;

create table "public"."points_ledger" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text not null,
    "source" text not null,
    "points" integer not null,
    "meta" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."points_ledger" enable row level security;

create table "public"."post_likes" (
    "post_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."post_likes" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "role" text not null default 'client'::text,
    "full_name" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "phone" text,
    "start_weight" numeric,
    "current_weight" numeric,
    "target_weight" numeric,
    "height" numeric,
    "plan" text default 'trial'::text,
    "level" integer default 1,
    "points" integer default 0,
    "referral_code" text,
    "referred_by" uuid,
    "referral_token" text,
    "affiliate_code" text,
    "name" text,
    "onboarding_stage" text,
    "wants_reminders" boolean default false,
    "wants_quotes" boolean default false
);


alter table "public"."profiles" enable row level security;

create table "public"."redemption_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "reward_name" text not null,
    "reward_icon" text,
    "points_spent" integer not null,
    "redeemed_at" timestamp with time zone not null default now()
);


alter table "public"."redemption_history" enable row level security;

create table "public"."resources" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "content" text,
    "owner_id" uuid not null,
    "permission" text default 'private'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."resources" enable row level security;

create table "public"."stripe_webhooks" (
    "id" integer not null default nextval('stripe_webhooks_id_seq'::regclass),
    "payload" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."stripe_webhooks" enable row level security;

create table "public"."system_logs" (
    "id" bigint generated always as identity not null,
    "created_at" timestamp with time zone default now(),
    "event_type" text not null,
    "details" jsonb,
    "user_id" uuid
);


alter table "public"."system_logs" enable row level security;

create table "public"."training_plans" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "plan" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."training_plans" enable row level security;

create table "public"."user_achievements" (
    "id" uuid not null default gen_random_uuid(),
    "phone_number" text not null,
    "achievement_name" text not null,
    "achievement_description" text,
    "achievement_type" text not null,
    "points_value" integer default 0,
    "unlocked_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_achievements" enable row level security;

create table "public"."user_badges" (
    "user_id" uuid not null,
    "badge_code" text not null,
    "earned_at" timestamp with time zone default now()
);


alter table "public"."user_badges" enable row level security;

create table "public"."user_integrations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "service_name" text not null,
    "is_connected" boolean not null default false,
    "credentials" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_integrations" enable row level security;

create table "public"."user_metrics" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "date" date not null default CURRENT_DATE,
    "weight" numeric,
    "mood_score" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "sleep_hours" numeric
);


alter table "public"."user_metrics" enable row level security;

create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

create table "public"."webhook_logs" (
    "id" uuid not null default gen_random_uuid(),
    "payload" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."webhook_logs" enable row level security;

alter table "public"."plans" drop column "description";

alter table "public"."plans" drop column "updated_at";

alter table "public"."plans" add column "benefits" text[];

alter table "public"."plans" add column "stripe_price_id" text;

alter table "public"."plans" add column "trial_days" integer default 7;

alter table "public"."plans" alter column "created_at" set not null;

alter table "public"."plans" alter column "features" set default '{}'::jsonb;

alter table "public"."plans" alter column "is_active" set not null;

alter table "public"."plans" alter column "price" set not null;

alter table "public"."rewards" drop column "image_url";

alter table "public"."rewards" drop column "is_available";

alter table "public"."rewards" drop column "points_required";

alter table "public"."rewards" drop column "title";

alter table "public"."rewards" drop column "updated_at";

alter table "public"."rewards" add column "icon" text;

alter table "public"."rewards" add column "is_active" boolean default true;

alter table "public"."rewards" add column "name" text not null;

alter table "public"."rewards" add column "points" integer not null;

alter table "public"."rewards" alter column "id" set default nextval('rewards_id_seq'::regclass);

alter table "public"."rewards" alter column "id" set data type integer using "id"::integer;

alter table "public"."user_profiles" add column "avatar_url" text;

alter table "public"."user_profiles" add column "full_name" text;

alter table "public"."user_profiles" alter column "role" drop not null;

alter sequence "public"."academies_id_seq" owned by "public"."academies"."id";

alter sequence "public"."affiliate_clicks_id_seq" owned by "public"."affiliate_clicks"."id";

alter sequence "public"."affiliate_commissions_id_seq" owned by "public"."affiliate_commissions"."id";

alter sequence "public"."affiliate_conversions_id_seq" owned by "public"."affiliate_conversions"."id";

alter sequence "public"."ai_events_id_seq" owned by "public"."ai_events"."id";

alter sequence "public"."ai_interactions_id_seq" owned by "public"."ai_interactions"."id";

alter sequence "public"."ai_messages_id_seq" owned by "public"."ai_messages"."id";

alter sequence "public"."ai_nudges_id_seq" owned by "public"."ai_nudges"."id";

alter sequence "public"."ai_settings_id_seq" owned by "public"."ai_settings"."id";

alter sequence "public"."error_logs_id_seq" owned by "public"."error_logs"."id";

alter sequence "public"."rewards_id_seq" owned by "public"."rewards"."id";

alter sequence "public"."stripe_webhooks_id_seq" owned by "public"."stripe_webhooks"."id";

CREATE UNIQUE INDEX academies_pkey ON public.academies USING btree (id);

CREATE UNIQUE INDEX activity_tracking_pkey ON public.activity_tracking USING btree (id);

CREATE UNIQUE INDEX affiliate_clicks_pkey ON public.affiliate_clicks USING btree (id);

CREATE UNIQUE INDEX affiliate_commissions_pkey ON public.affiliate_commissions USING btree (id);

CREATE UNIQUE INDEX affiliate_conversions_pkey ON public.affiliate_conversions USING btree (id);

CREATE UNIQUE INDEX affiliate_links_pkey ON public.affiliate_links USING btree (code);

CREATE UNIQUE INDEX affiliates_code_key ON public.affiliates USING btree (code);

CREATE UNIQUE INDEX affiliates_pkey ON public.affiliates USING btree (id);

CREATE UNIQUE INDEX ai_coach_actions_pkey ON public.ai_coach_actions USING btree (action_name);

CREATE UNIQUE INDEX ai_coach_settings_pkey ON public.ai_coach_settings USING btree (id);

CREATE UNIQUE INDEX ai_conversations_pkey ON public.ai_conversations USING btree (phone);

CREATE UNIQUE INDEX ai_events_pkey ON public.ai_events USING btree (id);

CREATE INDEX ai_interactions_phone_idx ON public.ai_interactions USING btree (phone, created_at DESC);

CREATE UNIQUE INDEX ai_interactions_pkey ON public.ai_interactions USING btree (id);

CREATE INDEX ai_messages_phone_created_idx ON public.ai_messages USING btree (phone, created_at DESC);

CREATE UNIQUE INDEX ai_messages_pkey ON public.ai_messages USING btree (id);

CREATE INDEX ai_nudges_due_idx ON public.ai_nudges USING btree (status, scheduled_at);

CREATE UNIQUE INDEX ai_nudges_pkey ON public.ai_nudges USING btree (id);

CREATE UNIQUE INDEX ai_settings_key_key ON public.ai_settings USING btree (key);

CREATE UNIQUE INDEX ai_settings_pkey ON public.ai_settings USING btree (id);

CREATE INDEX ai_users_last_user_at_idx ON public.ai_users USING btree (last_user_at DESC);

CREATE INDEX ai_users_next_action_idx ON public.ai_users USING btree (next_action);

CREATE INDEX ai_users_phone_idx ON public.ai_users USING btree (phone);

CREATE UNIQUE INDEX ai_users_phone_uidx ON public.ai_users USING btree (phone);

CREATE UNIQUE INDEX ai_users_pkey ON public.ai_users USING btree (phone);

CREATE INDEX ai_users_state_idx ON public.ai_users USING btree (state);

CREATE UNIQUE INDEX app_settings_key_key ON public.app_settings USING btree (key);

CREATE UNIQUE INDEX app_settings_pkey ON public.app_settings USING btree (key);

CREATE UNIQUE INDEX automations_pkey ON public.automations USING btree (id);

CREATE UNIQUE INDEX badges_pkey ON public.badges USING btree (code);

CREATE UNIQUE INDEX checkins_pkey ON public.checkins USING btree (id);

CREATE UNIQUE INDEX coach_user_state_pkey ON public.coach_user_state USING btree (user_id);

CREATE UNIQUE INDEX commissions_pkey ON public.commissions USING btree (id);

CREATE UNIQUE INDEX community_posts_pkey ON public.community_posts USING btree (id);

CREATE UNIQUE INDEX conversation_history_pkey ON public.conversation_history USING btree (id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE UNIQUE INDEX daily_metrics_pkey ON public.daily_metrics USING btree (user_id, day);

CREATE UNIQUE INDEX error_logs_pkey ON public.error_logs USING btree (id);

CREATE UNIQUE INDEX habit_logs_pkey ON public.habit_logs USING btree (habit_id, day);

CREATE UNIQUE INDEX habits_pkey ON public.habits USING btree (id);

CREATE INDEX idx_activity_tracking_completed_at ON public.activity_tracking USING btree (completed_at);

CREATE INDEX idx_activity_tracking_phone_number ON public.activity_tracking USING btree (phone_number);

CREATE INDEX idx_activity_tracking_type ON public.activity_tracking USING btree (activity_type);

CREATE INDEX idx_ai_events_phone_time ON public.ai_events USING btree (phone, created_at DESC);

CREATE INDEX idx_ai_events_type ON public.ai_events USING btree (type);

CREATE INDEX idx_ai_users_last_plan ON public.ai_users USING btree (last_plan_generated_at DESC);

CREATE INDEX idx_ai_users_step ON public.ai_users USING btree (step);

CREATE INDEX idx_community_posts_created_at ON public.community_posts USING btree (created_at DESC);

CREATE INDEX idx_community_posts_user_id ON public.community_posts USING btree (user_id);

CREATE INDEX idx_conversation_history_created_at ON public.conversation_history USING btree (created_at);

CREATE INDEX idx_conversation_history_message_type ON public.conversation_history USING btree (message_type);

CREATE INDEX idx_conversation_history_phone_number ON public.conversation_history USING btree (phone_number);

CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);

CREATE INDEX idx_post_likes_post_id ON public.post_likes USING btree (post_id);

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);

CREATE INDEX idx_resources_owner_id ON public.resources USING btree (owner_id);

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at DESC);

CREATE INDEX idx_system_logs_event_type ON public.system_logs USING btree (event_type);

CREATE INDEX idx_system_logs_user_id ON public.system_logs USING btree (user_id);

CREATE INDEX idx_user_achievements_phone_number ON public.user_achievements USING btree (phone_number);

CREATE INDEX idx_user_achievements_type ON public.user_achievements USING btree (achievement_type);

CREATE INDEX idx_user_achievements_unlocked_at ON public.user_achievements USING btree (unlocked_at);

CREATE UNIQUE INDEX inbound_events_pkey ON public.inbound_events USING btree (id);

CREATE UNIQUE INDEX integrations_evolution_pkey ON public.integrations_evolution USING btree (id);

CREATE UNIQUE INDEX integrations_pkey ON public.integrations USING btree (id);

CREATE UNIQUE INDEX integrations_service_key ON public.integrations USING btree (service);

CREATE UNIQUE INDEX integrations_whatsapp_pkey ON public.integrations_whatsapp USING btree (id);

CREATE UNIQUE INDEX integrations_whatsapp_provider_key ON public.integrations_whatsapp USING btree (provider);

CREATE UNIQUE INDEX measurements_pkey ON public.measurements USING btree (id);

CREATE UNIQUE INDEX nutrition_plans_pkey ON public.nutrition_plans USING btree (id);

CREATE UNIQUE INDEX payout_requests_pkey ON public.payout_requests USING btree (id);

CREATE UNIQUE INDEX plan_days_pkey ON public.plan_days USING btree (id);

CREATE UNIQUE INDEX points_ledger_pkey ON public.points_ledger USING btree (id);

CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (post_id, user_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_referral_code_key ON public.profiles USING btree (referral_code) WHERE (role = 'partner'::text);

CREATE UNIQUE INDEX redemption_history_pkey ON public.redemption_history USING btree (id);

CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id);

CREATE UNIQUE INDEX stripe_webhooks_pkey ON public.stripe_webhooks USING btree (id);

CREATE UNIQUE INDEX system_logs_pkey ON public.system_logs USING btree (id);

CREATE UNIQUE INDEX training_plans_pkey ON public.training_plans USING btree (id);

CREATE UNIQUE INDEX user_achievements_pkey ON public.user_achievements USING btree (id);

CREATE UNIQUE INDEX user_badges_pkey ON public.user_badges USING btree (user_id, badge_code);

CREATE UNIQUE INDEX user_integrations_pkey ON public.user_integrations USING btree (id);

CREATE UNIQUE INDEX user_integrations_user_id_service_name_key ON public.user_integrations USING btree (user_id, service_name);

CREATE UNIQUE INDEX user_metrics_pkey ON public.user_metrics USING btree (id);

CREATE UNIQUE INDEX user_metrics_user_id_date_key ON public.user_metrics USING btree (user_id, date);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX webhook_logs_pkey ON public.webhook_logs USING btree (id);

alter table "public"."academies" add constraint "academies_pkey" PRIMARY KEY using index "academies_pkey";

alter table "public"."activity_tracking" add constraint "activity_tracking_pkey" PRIMARY KEY using index "activity_tracking_pkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_pkey" PRIMARY KEY using index "affiliate_clicks_pkey";

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_pkey" PRIMARY KEY using index "affiliate_commissions_pkey";

alter table "public"."affiliate_conversions" add constraint "affiliate_conversions_pkey" PRIMARY KEY using index "affiliate_conversions_pkey";

alter table "public"."affiliate_links" add constraint "affiliate_links_pkey" PRIMARY KEY using index "affiliate_links_pkey";

alter table "public"."affiliates" add constraint "affiliates_pkey" PRIMARY KEY using index "affiliates_pkey";

alter table "public"."ai_coach_actions" add constraint "ai_coach_actions_pkey" PRIMARY KEY using index "ai_coach_actions_pkey";

alter table "public"."ai_coach_settings" add constraint "ai_coach_settings_pkey" PRIMARY KEY using index "ai_coach_settings_pkey";

alter table "public"."ai_conversations" add constraint "ai_conversations_pkey" PRIMARY KEY using index "ai_conversations_pkey";

alter table "public"."ai_events" add constraint "ai_events_pkey" PRIMARY KEY using index "ai_events_pkey";

alter table "public"."ai_interactions" add constraint "ai_interactions_pkey" PRIMARY KEY using index "ai_interactions_pkey";

alter table "public"."ai_messages" add constraint "ai_messages_pkey" PRIMARY KEY using index "ai_messages_pkey";

alter table "public"."ai_nudges" add constraint "ai_nudges_pkey" PRIMARY KEY using index "ai_nudges_pkey";

alter table "public"."ai_settings" add constraint "ai_settings_pkey" PRIMARY KEY using index "ai_settings_pkey";

alter table "public"."ai_users" add constraint "ai_users_pkey" PRIMARY KEY using index "ai_users_pkey";

alter table "public"."app_settings" add constraint "app_settings_pkey" PRIMARY KEY using index "app_settings_pkey";

alter table "public"."automations" add constraint "automations_pkey" PRIMARY KEY using index "automations_pkey";

alter table "public"."badges" add constraint "badges_pkey" PRIMARY KEY using index "badges_pkey";

alter table "public"."checkins" add constraint "checkins_pkey" PRIMARY KEY using index "checkins_pkey";

alter table "public"."coach_user_state" add constraint "coach_user_state_pkey" PRIMARY KEY using index "coach_user_state_pkey";

alter table "public"."commissions" add constraint "commissions_pkey" PRIMARY KEY using index "commissions_pkey";

alter table "public"."community_posts" add constraint "community_posts_pkey" PRIMARY KEY using index "community_posts_pkey";

alter table "public"."conversation_history" add constraint "conversation_history_pkey" PRIMARY KEY using index "conversation_history_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."daily_metrics" add constraint "daily_metrics_pkey" PRIMARY KEY using index "daily_metrics_pkey";

alter table "public"."error_logs" add constraint "error_logs_pkey" PRIMARY KEY using index "error_logs_pkey";

alter table "public"."habit_logs" add constraint "habit_logs_pkey" PRIMARY KEY using index "habit_logs_pkey";

alter table "public"."habits" add constraint "habits_pkey" PRIMARY KEY using index "habits_pkey";

alter table "public"."inbound_events" add constraint "inbound_events_pkey" PRIMARY KEY using index "inbound_events_pkey";

alter table "public"."integrations" add constraint "integrations_pkey" PRIMARY KEY using index "integrations_pkey";

alter table "public"."integrations_evolution" add constraint "integrations_evolution_pkey" PRIMARY KEY using index "integrations_evolution_pkey";

alter table "public"."integrations_whatsapp" add constraint "integrations_whatsapp_pkey" PRIMARY KEY using index "integrations_whatsapp_pkey";

alter table "public"."measurements" add constraint "measurements_pkey" PRIMARY KEY using index "measurements_pkey";

alter table "public"."nutrition_plans" add constraint "nutrition_plans_pkey" PRIMARY KEY using index "nutrition_plans_pkey";

alter table "public"."payout_requests" add constraint "payout_requests_pkey" PRIMARY KEY using index "payout_requests_pkey";

alter table "public"."plan_days" add constraint "plan_days_pkey" PRIMARY KEY using index "plan_days_pkey";

alter table "public"."points_ledger" add constraint "points_ledger_pkey" PRIMARY KEY using index "points_ledger_pkey";

alter table "public"."post_likes" add constraint "post_likes_pkey" PRIMARY KEY using index "post_likes_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."redemption_history" add constraint "redemption_history_pkey" PRIMARY KEY using index "redemption_history_pkey";

alter table "public"."resources" add constraint "resources_pkey" PRIMARY KEY using index "resources_pkey";

alter table "public"."stripe_webhooks" add constraint "stripe_webhooks_pkey" PRIMARY KEY using index "stripe_webhooks_pkey";

alter table "public"."system_logs" add constraint "system_logs_pkey" PRIMARY KEY using index "system_logs_pkey";

alter table "public"."training_plans" add constraint "training_plans_pkey" PRIMARY KEY using index "training_plans_pkey";

alter table "public"."user_achievements" add constraint "user_achievements_pkey" PRIMARY KEY using index "user_achievements_pkey";

alter table "public"."user_badges" add constraint "user_badges_pkey" PRIMARY KEY using index "user_badges_pkey";

alter table "public"."user_integrations" add constraint "user_integrations_pkey" PRIMARY KEY using index "user_integrations_pkey";

alter table "public"."user_metrics" add constraint "user_metrics_pkey" PRIMARY KEY using index "user_metrics_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."webhook_logs" add constraint "webhook_logs_pkey" PRIMARY KEY using index "webhook_logs_pkey";

alter table "public"."activity_tracking" add constraint "activity_tracking_activity_type_check" CHECK ((activity_type = ANY (ARRAY['exercise'::text, 'nutrition'::text, 'meditation'::text, 'general'::text]))) not valid;

alter table "public"."activity_tracking" validate constraint "activity_tracking_activity_type_check";

alter table "public"."activity_tracking" add constraint "activity_tracking_points_earned_check" CHECK ((points_earned >= 0)) not valid;

alter table "public"."activity_tracking" validate constraint "activity_tracking_points_earned_check";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_code_fkey" FOREIGN KEY (code) REFERENCES affiliate_links(code) ON DELETE CASCADE not valid;

alter table "public"."affiliate_clicks" validate constraint "affiliate_clicks_code_fkey";

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_conversion_id_fkey" FOREIGN KEY (conversion_id) REFERENCES affiliate_conversions(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_commissions" validate constraint "affiliate_commissions_conversion_id_fkey";

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_commissions" validate constraint "affiliate_commissions_partner_id_fkey";

alter table "public"."affiliate_conversions" add constraint "affiliate_conversions_code_fkey" FOREIGN KEY (code) REFERENCES affiliate_links(code) ON DELETE CASCADE not valid;

alter table "public"."affiliate_conversions" validate constraint "affiliate_conversions_code_fkey";

alter table "public"."affiliate_conversions" add constraint "affiliate_conversions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_conversions" validate constraint "affiliate_conversions_user_id_fkey";

alter table "public"."affiliate_links" add constraint "affiliate_links_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_links" validate constraint "affiliate_links_partner_id_fkey";

alter table "public"."affiliates" add constraint "affiliates_code_key" UNIQUE using index "affiliates_code_key";

alter table "public"."ai_events" add constraint "ai_events_phone_fkey" FOREIGN KEY (phone) REFERENCES ai_users(phone) ON DELETE CASCADE not valid;

alter table "public"."ai_events" validate constraint "ai_events_phone_fkey";

alter table "public"."ai_messages" add constraint "ai_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))) not valid;

alter table "public"."ai_messages" validate constraint "ai_messages_role_check";

alter table "public"."ai_settings" add constraint "ai_settings_key_key" UNIQUE using index "ai_settings_key_key";

alter table "public"."ai_users" add constraint "ai_users_context_check" CHECK ((train_context = ANY (ARRAY['casa'::text, 'academia'::text, 'hibrido'::text]))) not valid;

alter table "public"."ai_users" validate constraint "ai_users_context_check";

alter table "public"."ai_users" add constraint "ai_users_days_check" CHECK (((days_per_week >= 1) AND (days_per_week <= 7))) not valid;

alter table "public"."ai_users" validate constraint "ai_users_days_check";

alter table "public"."ai_users" add constraint "ai_users_level_check" CHECK ((level = ANY (ARRAY['iniciante'::text, 'intermediario'::text, 'avancado'::text]))) not valid;

alter table "public"."ai_users" validate constraint "ai_users_level_check";

alter table "public"."ai_users" add constraint "ai_users_minutes_check" CHECK (((minutes_per_day >= 5) AND (minutes_per_day <= 180))) not valid;

alter table "public"."ai_users" validate constraint "ai_users_minutes_check";

alter table "public"."ai_users" add constraint "ai_users_step_check" CHECK ((step = ANY (ARRAY['discovery'::text, 'support'::text, 'progress'::text]))) not valid;

alter table "public"."ai_users" validate constraint "ai_users_step_check";

alter table "public"."ai_users" add constraint "ai_users_training_place_check" CHECK ((training_place = ANY (ARRAY['casa'::text, 'academia'::text]))) not valid;

alter table "public"."ai_users" validate constraint "ai_users_training_place_check";

alter table "public"."app_settings" add constraint "app_settings_key_key" UNIQUE using index "app_settings_key_key";

alter table "public"."coach_user_state" add constraint "coach_user_state_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."coach_user_state" validate constraint "coach_user_state_user_id_fkey";

alter table "public"."commissions" add constraint "commissions_affiliate_code_fkey" FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) not valid;

alter table "public"."commissions" validate constraint "commissions_affiliate_code_fkey";

alter table "public"."community_posts" add constraint "community_posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."community_posts" validate constraint "community_posts_user_id_fkey";

alter table "public"."conversation_history" add constraint "conversation_history_message_type_check" CHECK ((message_type = ANY (ARRAY['user'::text, 'assistant'::text]))) not valid;

alter table "public"."conversation_history" validate constraint "conversation_history_message_type_check";

alter table "public"."conversation_history" add constraint "conversation_history_sentiment_score_check" CHECK (((sentiment_score >= '-1.0'::numeric) AND (sentiment_score <= 1.0))) not valid;

alter table "public"."conversation_history" validate constraint "conversation_history_sentiment_score_check";

alter table "public"."conversations" add constraint "conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_user_id_fkey";

alter table "public"."daily_metrics" add constraint "daily_metrics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."daily_metrics" validate constraint "daily_metrics_user_id_fkey";

alter table "public"."habit_logs" add constraint "habit_logs_habit_id_fkey" FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE not valid;

alter table "public"."habit_logs" validate constraint "habit_logs_habit_id_fkey";

alter table "public"."habits" add constraint "habits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."habits" validate constraint "habits_user_id_fkey";

alter table "public"."integrations" add constraint "integrations_service_key" UNIQUE using index "integrations_service_key";

alter table "public"."integrations_whatsapp" add constraint "integrations_whatsapp_provider_key" UNIQUE using index "integrations_whatsapp_provider_key";

alter table "public"."nutrition_plans" add constraint "nutrition_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."nutrition_plans" validate constraint "nutrition_plans_user_id_fkey";

alter table "public"."payout_requests" add constraint "payout_requests_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES profiles(id) not valid;

alter table "public"."payout_requests" validate constraint "payout_requests_partner_id_fkey";

alter table "public"."plan_days" add constraint "plan_days_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE not valid;

alter table "public"."plan_days" validate constraint "plan_days_plan_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_referred_by_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'client'::text, 'partner'::text, 'gym'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."redemption_history" add constraint "redemption_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."redemption_history" validate constraint "redemption_history_user_id_fkey";

alter table "public"."resources" add constraint "resources_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."resources" validate constraint "resources_owner_id_fkey";

alter table "public"."system_logs" add constraint "system_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."system_logs" validate constraint "system_logs_user_id_fkey";

alter table "public"."training_plans" add constraint "training_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."training_plans" validate constraint "training_plans_user_id_fkey";

alter table "public"."user_achievements" add constraint "user_achievements_achievement_type_check" CHECK ((achievement_type = ANY (ARRAY['fitness'::text, 'nutrition'::text, 'mental_health'::text, 'spirituality'::text, 'streak'::text, 'points'::text]))) not valid;

alter table "public"."user_achievements" validate constraint "user_achievements_achievement_type_check";

alter table "public"."user_achievements" add constraint "user_achievements_points_value_check" CHECK ((points_value >= 0)) not valid;

alter table "public"."user_achievements" validate constraint "user_achievements_points_value_check";

alter table "public"."user_badges" add constraint "user_badges_badge_code_fkey" FOREIGN KEY (badge_code) REFERENCES badges(code) ON DELETE CASCADE not valid;

alter table "public"."user_badges" validate constraint "user_badges_badge_code_fkey";

alter table "public"."user_badges" add constraint "user_badges_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_badges" validate constraint "user_badges_user_id_fkey";

alter table "public"."user_integrations" add constraint "user_integrations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_integrations" validate constraint "user_integrations_user_id_fkey";

alter table "public"."user_integrations" add constraint "user_integrations_user_id_service_name_key" UNIQUE using index "user_integrations_user_id_service_name_key";

alter table "public"."user_metrics" add constraint "user_metrics_user_id_date_key" UNIQUE using index "user_metrics_user_id_date_key";

alter table "public"."user_metrics" add constraint "user_metrics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_metrics" validate constraint "user_metrics_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

set check_function_bodies = off;

create or replace view "public"."accessible_resources" as  SELECT id,
    title,
    content,
    owner_id,
    permission,
    created_at,
    updated_at,
    (owner_id = auth.uid()) AS is_owner
   FROM resources;


CREATE OR REPLACE FUNCTION public.auth_has_access_to_resource(req json)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.auth_has_access_to_resource(resource_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.auth_has_access_to_resource(resource_id uuid, permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.auth_has_access_to_resource(resource_owner uuid, resource_id uuid, permission_level text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_access(resource_id uuid, required_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Use private helper function
  user_role := private.get_user_role();
  
  -- Compare roles (simplified example)
  RETURN user_role = required_role;
END;
$function$
;

create or replace view "public"."community_feed" as  SELECT cp.id,
    cp.user_id,
    cp.content,
    cp.likes,
    cp.created_at,
    p.name AS author_name,
    count(pl.user_id) AS actual_likes_count
   FROM ((community_posts cp
     LEFT JOIN profiles p ON ((cp.user_id = p.id)))
     LEFT JOIN post_likes pl ON ((cp.id = pl.post_id)))
  GROUP BY cp.id, cp.user_id, cp.content, cp.likes, cp.created_at, p.name
  ORDER BY cp.created_at DESC;


CREATE OR REPLACE FUNCTION public.create_user_profile_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
exception when others then
  -- log opcional
  insert into public.error_logs(context, details)
  values ('create_user_profile_on_signup', sqlerrm);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_referral_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_auth_user()
 RETURNS uuid
 LANGUAGE sql
AS $function$
    SELECT auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_auth_user(auth_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RAISE NOTICE 'Getting partner dashboard data';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data_v2(partner_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data_v3(partner_id uuid, start_date date, end_date date)
 RETURNS TABLE(date date, revenue numeric, users integer)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_users()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.grant_subscription_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_test()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RAISE NOTICE 'Handle new user test executed';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_test(user_id uuid, email text, meta_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_redemption()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    -- Subtract the points spent from the user's profile
    UPDATE public.profiles
    SET points = points - NEW.points_spent
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_stripe_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  insert into public.error_logs(context, details)
  values ('handle_stripe_webhook', coalesce(NEW.event_type, 'no type'));
  return NEW;
exception when others then
  insert into public.error_logs(context, details)
  values ('handle_stripe_webhook_error', sqlerrm);
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid()
       and p.role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_error(error_message text, error_details jsonb DEFAULT '{}'::jsonb, severity text DEFAULT 'error'::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_info(event_name text, event_details jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_system_event(event_type text, details jsonb, user_id uuid DEFAULT NULL::uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_system_event(event_type text, event_data json)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Definir search_path vazio para segurança
    SET search_path = '';
    
    INSERT INTO public.system_logs (event_type, event_data, created_at)
    VALUES (event_type, event_data, now());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_system_event(p_event_type text, p_message text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.system_logs (event_type, message, metadata)
    VALUES (p_event_type, p_message, p_metadata);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.logged_function_example(param1 text, param2 integer)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.maintain_analytics()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.on_auth_user_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Cria o profile mínimo (id/email) do usuário recém-criado no auth.users
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  -- (Opcional) se tiver metadata de nome/avatar, atualiza SEM travar se colunas não existirem
  -- De propósito, estamos mantendo só o essencial para não quebrar caso colunas variem.

  return new;

exception when others then
  -- Não deixar a autenticação quebrar: registra e segue
  -- Se não existir uma tabela de logs, este bloco ainda assim retorna NEW e não bloqueia o signup/login.
  begin
    insert into public.error_logs(source, level, message, detail, created_at)
    values ('on_auth_user_created', 'error', sqlerrm, format('uid=%s email=%s', new.id, new.email), now());
  exception when others then
    -- ignora se não houver tabela de logs
    null;
  end;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_affiliate_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_records(search_term text, category text DEFAULT NULL::text, max_results integer DEFAULT 100)
 RETURNS TABLE(id uuid, title text, description text)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_default_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    -- Set default role for new users
    IF NEW.role IS NULL THEN
        NEW.role = 'user';
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_auth_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.test_complete_signup()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RAISE NOTICE 'Test complete signup executed';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_handle_new_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RAISE NOTICE 'Test handle new user executed';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_handle_new_user(user_id_param uuid, email_param text DEFAULT NULL::text, name_param text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.test_profile_creation(user_id uuid, user_email text, user_phone text, user_meta jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.test_query_performance(query_text text, num_executions integer DEFAULT 5)
 RETURNS TABLE(execution_number integer, execution_time_ms numeric)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

create or replace view "public"."v_client_progress" as  SELECT id AS user_id,
    full_name,
    ( SELECT dm.weight_kg
           FROM daily_metrics dm
          WHERE (dm.user_id = p.id)
          ORDER BY dm.day DESC
         LIMIT 1) AS weight_latest,
    ( SELECT sum(dm.workouts) AS sum
           FROM daily_metrics dm
          WHERE ((dm.user_id = p.id) AND (dm.day >= (CURRENT_DATE - '7 days'::interval)))) AS workouts_week,
    ( SELECT count(*) AS count
           FROM (habit_logs hl
             JOIN habits h ON ((h.id = hl.habit_id)))
          WHERE ((h.user_id = p.id) AND (hl.day >= (CURRENT_DATE - '7 days'::interval)) AND hl.done)) AS habits_done_week
   FROM profiles p;


create or replace view "public"."v_partner_dashboard" as  SELECT l.partner_id,
    count(DISTINCT c.id) AS clicks,
    count(DISTINCT conv.id) AS conversions,
    COALESCE(sum(comm.amount_cents), (0)::bigint) AS commissions_cents,
    sum(
        CASE
            WHEN (comm.status = 'paid'::text) THEN comm.amount_cents
            ELSE 0
        END) AS paid_cents
   FROM (((affiliate_links l
     LEFT JOIN affiliate_clicks c ON ((c.code = l.code)))
     LEFT JOIN affiliate_conversions conv ON ((conv.code = l.code)))
     LEFT JOIN affiliate_commissions comm ON ((comm.partner_id = l.partner_id)))
  GROUP BY l.partner_id;


CREATE OR REPLACE FUNCTION public.create_gamification_for_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert gamification record with conflict handling
  INSERT INTO public.gamification (user_id, points, level, streak_days, total_checkins, badges)
  VALUES (NEW.id, 0, 1, 0, 0, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_phone TEXT;
BEGIN
  -- Extract phone from metadata
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'phone',
    NULL
  );

  INSERT INTO public.user_profiles (
    id,
    name,
    email,
    activity_level,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.email, 'user' || substr(NEW.id::text, 1, 8) || '@temp.local'),
    'moderate',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, user_profiles.name),
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    updated_at = NOW();
  
  -- Create gamification record if it doesn't exist
  INSERT INTO public.gamification (
    user_id,
    level,
    xp,
    coins,
    streak,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    1,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

create policy "Allow admin to manage academies"
on "public"."academies"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Enable read access for all users"
on "public"."academies"
as permissive
for select
to public
using (true);


create policy "Service role can manage activity_tracking"
on "public"."activity_tracking"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view activity_tracking"
on "public"."activity_tracking"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."affiliate_clicks"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."affiliate_commissions"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."affiliate_conversions"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."affiliate_links"
as permissive
for select
to public
using (true);


create policy "Allow admins to manage all affiliates"
on "public"."affiliates"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Allow partners to view affiliates"
on "public"."affiliates"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'partner'::text)))));


create policy "Allow public read access to active affiliates"
on "public"."affiliates"
as permissive
for select
to anon, authenticated
using ((active = true));


create policy "Service role full access"
on "public"."affiliates"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "affiliates_select_all"
on "public"."affiliates"
as permissive
for select
to public
using (true);


create policy "Public read access"
on "public"."ai_coach_actions"
as permissive
for select
to public
using (true);


create policy "Public read access"
on "public"."ai_coach_settings"
as permissive
for select
to public
using (true);


create policy "service_role_all_ai_conversations"
on "public"."ai_conversations"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "ai_events_service"
on "public"."ai_events"
as permissive
for all
to public
using (true)
with check (true);


create policy "service_role_all_ai_interactions"
on "public"."ai_interactions"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "ai_messages_service"
on "public"."ai_messages"
as permissive
for all
to public
using (true)
with check (true);


create policy "ai_messages_service_all"
on "public"."ai_messages"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Public read access"
on "public"."ai_nudges"
as permissive
for select
to public
using (true);


create policy "ai_read"
on "public"."ai_settings"
as permissive
for select
to authenticated
using (true);


create policy "ai_settings admin write"
on "public"."ai_settings"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = 'admin'::text)))));


create policy "ai_settings read"
on "public"."ai_settings"
as permissive
for select
to public
using (true);


create policy "ai_write_admin"
on "public"."ai_settings"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "read ai settings"
on "public"."ai_settings"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."ai_users"
as permissive
for select
to public
using (true);


create policy "Allow admin to manage settings"
on "public"."app_settings"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Allow admin to manage automations"
on "public"."automations"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Allow authenticated users to read automations"
on "public"."automations"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."automations"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."badges"
as permissive
for select
to public
using (true);


create policy "service_role_all_checkins"
on "public"."checkins"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users own data"
on "public"."coach_user_state"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "service_role_all_commissions"
on "public"."commissions"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Allow admins to manage all posts"
on "public"."community_posts"
as permissive
for all
to public
using (is_admin());


create policy "Allow users to delete their own posts"
on "public"."community_posts"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Allow users to insert their own posts"
on "public"."community_posts"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Allow users to read all posts"
on "public"."community_posts"
as permissive
for select
to public
using (true);


create policy "Allow users to update their own posts"
on "public"."community_posts"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Service role can manage conversation_history"
on "public"."conversation_history"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view conversation_history"
on "public"."conversation_history"
as permissive
for select
to public
using (true);


create policy "Allow admins to manage all conversations"
on "public"."conversations"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Allow users to insert their own conversations"
on "public"."conversations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Allow users to read their own conversations"
on "public"."conversations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users own data"
on "public"."daily_metrics"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Public read habit logs"
on "public"."habit_logs"
as permissive
for select
to public
using (true);


create policy "Public read access"
on "public"."habits"
as permissive
for select
to public
using (true);


create policy "Public read access"
on "public"."inbound_events"
as permissive
for select
to public
using (true);


create policy "Allow admin to manage integrations"
on "public"."integrations"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Public read access"
on "public"."integrations_evolution"
as permissive
for select
to public
using (true);


create policy "Public read access"
on "public"."integrations_whatsapp"
as permissive
for select
to public
using (true);


create policy "service_role_all_measurements"
on "public"."measurements"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Enable read access for all users"
on "public"."nutrition_plans"
as permissive
for select
to public
using (true);


create policy "Allow admins to manage all payout requests"
on "public"."payout_requests"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Allow partners to manage their own payout requests"
on "public"."payout_requests"
as permissive
for all
to public
using ((auth.uid() = partner_id));


create policy "service_role_all_plan_days"
on "public"."plan_days"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Allow admin to manage plans"
on "public"."plans"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Allow authenticated users to read active plans"
on "public"."plans"
as permissive
for select
to authenticated
using ((is_active = true));


create policy "plans_read_public"
on "public"."plans"
as permissive
for select
to anon, authenticated
using (true);


create policy "public read plans"
on "public"."plans"
as permissive
for select
to anon
using (true);


create policy "public_read_plans"
on "public"."plans"
as permissive
for select
to anon
using (true);


create policy "service_role_all_points_ledger"
on "public"."points_ledger"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Allow users to delete their own likes"
on "public"."post_likes"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Allow users to insert their own likes"
on "public"."post_likes"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Allow users to read all likes"
on "public"."post_likes"
as permissive
for select
to public
using (true);


create policy "Allow authenticated users to read all profiles"
on "public"."profiles"
as permissive
for select
to authenticated
using (true);


create policy "Allow full access for service role"
on "public"."profiles"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));


create policy "Allow individual read access"
on "public"."profiles"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = id));


create policy "Allow individual update access"
on "public"."profiles"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Service role can create profiles"
on "public"."profiles"
as permissive
for insert
to service_role
with check (true);


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Users can view own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Usuários podem atualizar seu próprio perfil"
on "public"."profiles"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Usuários podem atualizar seus próprios perfis"
on "public"."profiles"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Usuários podem ver seu próprio perfil"
on "public"."profiles"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "Usuários podem ver seus próprios perfis"
on "public"."profiles"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "p_insert_own"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "p_select_own"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "p_update_own"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "profiles_select_own"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "profiles_update_own"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "read_own_profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "update_own_profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Allow admins to insert redemptions"
on "public"."redemption_history"
as permissive
for insert
to public
with check (is_admin());


create policy "Allow admins to view all redemptions"
on "public"."redemption_history"
as permissive
for select
to public
using (is_admin());


create policy "Allow users to insert their own redemptions"
on "public"."redemption_history"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Allow users to view their own redemptions"
on "public"."redemption_history"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Usuarios podem atualizar seus próprios recursos"
on "public"."resources"
as permissive
for update
to authenticated
using ((owner_id = auth.uid()))
with check ((owner_id = auth.uid()));


create policy "Usuarios podem excluir seus próprios recursos"
on "public"."resources"
as permissive
for delete
to authenticated
using ((owner_id = auth.uid()));


create policy "Usuarios podem inserir seus próprios recursos"
on "public"."resources"
as permissive
for insert
to authenticated
with check ((owner_id = auth.uid()));


create policy "Usuarios podem visualizar seus próprios recursos ou recursos p"
on "public"."resources"
as permissive
for select
to authenticated
using (auth_has_access_to_resource(owner_id, id, permission));


create policy "Allow admin to manage rewards"
on "public"."rewards"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Allow authenticated users to read active rewards"
on "public"."rewards"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (is_active = true)));


create policy "public read rewards"
on "public"."rewards"
as permissive
for select
to anon
using (true);


create policy "public_read_rewards"
on "public"."rewards"
as permissive
for select
to anon
using (true);


create policy "rewards_read_public"
on "public"."rewards"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow service_role to insert webhooks"
on "public"."stripe_webhooks"
as permissive
for insert
to public
with check ((auth.role() = 'service_role'::text));


create policy "Admin pode ver todos os logs"
on "public"."system_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Administrators can add logs for any user"
on "public"."system_logs"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::text)))));


create policy "Administrators can view all logs"
on "public"."system_logs"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::text)))));


create policy "Only administrators can delete logs"
on "public"."system_logs"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::text)))));


create policy "Only administrators can update logs"
on "public"."system_logs"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::text)))));


create policy "Serviços podem gerenciar logs"
on "public"."system_logs"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can add their own logs"
on "public"."system_logs"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can view their own logs"
on "public"."system_logs"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users own training plans"
on "public"."training_plans"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Service role can manage user_achievements"
on "public"."user_achievements"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view user_achievements"
on "public"."user_achievements"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."user_badges"
as permissive
for select
to public
using (true);


create policy "Allow admins to view all integrations"
on "public"."user_integrations"
as permissive
for select
to public
using (is_admin());


create policy "Allow users to manage their own integrations"
on "public"."user_integrations"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Allow admins to view all user metrics"
on "public"."user_metrics"
as permissive
for select
to public
using (is_admin());


create policy "Allow authenticated users to insert their own metrics"
on "public"."user_metrics"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Allow authenticated users to read their own metrics"
on "public"."user_metrics"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow authenticated users to update their own metrics"
on "public"."user_metrics"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Service role can create user_profiles"
on "public"."user_profiles"
as permissive
for insert
to service_role
with check (true);


create policy "Service role full access"
on "public"."user_profiles"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


create policy "read own profile"
on "public"."user_profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "update own profile"
on "public"."user_profiles"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "users_service_read"
on "public"."users"
as permissive
for select
to service_role
using (true);


create policy "webhook_logs_service_all"
on "public"."webhook_logs"
as permissive
for all
to service_role
using (true)
with check (true);


CREATE TRIGGER tr_generate_affiliate_code BEFORE INSERT ON public.affiliates FOR EACH ROW EXECUTE FUNCTION generate_affiliate_code();

CREATE TRIGGER ai_users_updated_at BEFORE UPDATE ON public.ai_users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trg_ai_users_updated BEFORE UPDATE ON public.ai_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ai_users_updated_at BEFORE UPDATE ON public.ai_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER on_profile_insert_generate_affiliate_code BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION generate_affiliate_code();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_profiles_referral_token BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION ensure_referral_token();

CREATE TRIGGER on_redemption_created AFTER INSERT ON public.redemption_history FOR EACH ROW EXECUTE FUNCTION handle_redemption();

CREATE TRIGGER update_resources_timestamp BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER on_stripe_webhook_received AFTER INSERT ON public.stripe_webhooks FOR EACH ROW EXECUTE FUNCTION handle_stripe_webhook();


