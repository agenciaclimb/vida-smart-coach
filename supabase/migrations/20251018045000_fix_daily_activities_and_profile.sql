-- Patch daily activities schema and safe_upsert_user_profile signature
set check_function_bodies = off;

-- Ensure daily_activities has the expected columns
alter table public.daily_activities
    add column if not exists activity_name text,
    add column if not exists activity_type text,
    add column if not exists activity_date date;

-- Backfill defaults for newly added columns
update public.daily_activities
   set activity_name = coalesce(activity_name, 'unspecified')
 where activity_name is null;

update public.daily_activities
   set activity_type = coalesce(activity_type, 'unspecified')
 where activity_type is null;

update public.daily_activities
   set activity_date = coalesce(activity_date, current_date)
 where activity_date is null;

alter table public.daily_activities
  alter column activity_name set not null,
  alter column activity_type set not null,
  alter column activity_date set not null,
  alter column activity_date set default current_date;

-- Recreate safe_upsert_user_profile with notification flags
create or replace function public.safe_upsert_user_profile(
    p_user_id uuid,
    p_full_name text default null,
    p_name text default null,
    p_email text default null,
    p_phone varchar(20) default null,
    p_age integer default null,
    p_height integer default null,
    p_current_weight numeric default null,
    p_target_weight numeric default null,
    p_gender varchar(20) default null,
    p_activity_level varchar(30) default null,
    p_goal_type varchar(50) default null,
    p_wants_reminders boolean default null,
    p_wants_quotes boolean default null
)
returns public.user_profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    result public.user_profiles;
    normalized_activity_level varchar(30);
    normalized_goal_type varchar(50);
begin
    normalized_activity_level := case
        when p_activity_level in ('sedentario', 'sedentario(a)') then 'sedentary'
        when p_activity_level in ('levemente_ativo', 'levemente ativo') then 'light'
        when p_activity_level in ('moderadamente_ativo', 'moderadamente ativo') then 'moderate'
        when p_activity_level in ('muito_ativo', 'muito ativo') then 'very_active'
        when p_activity_level in ('extremamente_ativo', 'extremamente ativo', 'super_active') then 'super_active'
        when p_activity_level in ('sedentary', 'light', 'moderate', 'very_active', 'super_active') then p_activity_level
        else null
    end;

    normalized_goal_type := case
        when p_goal_type in ('perder peso', 'perder_peso') then 'lose_weight'
        when p_goal_type in ('ganhar massa muscular', 'ganhar_massa') then 'gain_muscle'
        when p_goal_type in ('manter peso', 'manter_peso') then 'maintain_weight'
        when p_goal_type in ('melhorar condicionamento', 'melhorar_condicionamento') then 'improve_fitness'
        when p_goal_type in ('saude geral', 'saude_geral') then 'general_health'
        when p_goal_type in ('lose_weight', 'gain_muscle', 'maintain_weight', 'improve_fitness', 'general_health') then p_goal_type
        else null
    end;

    insert into public.user_profiles (
        id, full_name, name, email, phone, age, height,
        current_weight, target_weight, gender, activity_level, goal_type,
        wants_reminders, wants_quotes,
        created_at, updated_at
    ) values (
        p_user_id,
        p_full_name,
        coalesce(p_name, p_full_name),
        p_email,
        p_phone,
        p_age,
        p_height,
        p_current_weight,
        p_target_weight,
        p_gender,
        normalized_activity_level,
        normalized_goal_type,
        coalesce(p_wants_reminders, false),
        coalesce(p_wants_quotes, false),
        now(),
        now()
    )
    on conflict (id) do update set
        full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
        name = coalesce(excluded.name, excluded.full_name, public.user_profiles.name),
        email = coalesce(excluded.email, public.user_profiles.email),
        phone = coalesce(excluded.phone, public.user_profiles.phone),
        age = coalesce(excluded.age, public.user_profiles.age),
        height = coalesce(excluded.height, public.user_profiles.height),
        current_weight = coalesce(excluded.current_weight, public.user_profiles.current_weight),
        target_weight = coalesce(excluded.target_weight, public.user_profiles.target_weight),
        gender = coalesce(excluded.gender, public.user_profiles.gender),
        activity_level = coalesce(excluded.activity_level, public.user_profiles.activity_level),
        goal_type = coalesce(excluded.goal_type, public.user_profiles.goal_type),
        wants_reminders = coalesce(excluded.wants_reminders, public.user_profiles.wants_reminders),
        wants_quotes = coalesce(excluded.wants_quotes, public.user_profiles.wants_quotes),
        updated_at = now()
    returning * into result;

    return result;
end;
$$;

grant execute on function public.safe_upsert_user_profile(
    uuid, text, text, text, varchar, integer, integer, numeric, numeric, varchar, varchar, varchar, boolean, boolean
) to anon, authenticated, service_role;
