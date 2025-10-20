-- Restore gamification objects and profile helpers required by the dashboard
set check_function_bodies = off;

-- 1) Ensure user_achievements table exists (idempotent definition)
create table if not exists public.user_achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    achievement_id uuid references public.achievements(id) on delete cascade,
    earned_at timestamptz default now(),
    progress jsonb default '{}'::jsonb,
    unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'user_achievements'
       and column_name = 'user_id'
  ) then
    if not exists (
      select 1 from pg_policies
       where schemaname = 'public'
         and tablename = 'user_achievements'
         and policyname = 'Users can view own achievements'
    ) then
      create policy "Users can view own achievements"
        on public.user_achievements
        for select
        using (auth.uid() = user_id);
    end if;
  end if;
end
$$;

-- 2) Recreate gamification summary view (drops silently if not present)
drop view if exists public.user_gamification_summary;

create or replace view public.user_gamification_summary as
select
    g.user_id,
    up.name,
    up.email,
    g.total_points,
    g.level,
    g.current_streak,
    g.longest_streak,
    g.physical_points,
    g.nutrition_points,
    g.emotional_points,
    g.spiritual_points,
    g.referral_points,
    g.achievement_points,
    g.badges,
    count(ua.id) as achievements_count,
    g.updated_at
from public.gamification g
join public.user_profiles up on up.id = g.user_id
left join public.user_achievements ua on ua.phone_number = up.phone
group by g.user_id, up.name, up.email, g.total_points, g.level, g.current_streak,
         g.longest_streak, g.physical_points, g.nutrition_points, g.emotional_points,
         g.spiritual_points, g.referral_points, g.achievement_points, g.badges, g.updated_at;

-- 3) Adjust daily missions security (allow inserts via RPC)
alter table public.daily_missions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'daily_missions'
       and policyname = 'Users can insert own missions'
  ) then
    create policy "Users can insert own missions"
      on public.daily_missions
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- 4) Regenerate function generate_daily_missions_for_user with SECURITY DEFINER
create or replace function public.generate_daily_missions_for_user(
  p_user_id uuid,
  p_date date default current_date
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    missions_data jsonb := '[
        {"type": "easy", "category": "physical", "title": "Check-in de treino", "description": "Faca seu check-in de treino diario", "points": 10},
        {"type": "easy", "category": "nutrition", "title": "Registrar refeicao", "description": "Registre pelo menos uma refeicao", "points": 10},
        {"type": "easy", "category": "emotional", "title": "Check-in de humor", "description": "Registre como voce esta se sentindo", "points": 10},
        {"type": "medium", "category": "physical", "title": "Meta de passos", "description": "Alcance sua meta diaria de passos", "points": 20},
        {"type": "medium", "category": "nutrition", "title": "Meta de agua", "description": "Beba sua meta diaria de agua", "points": 15},
        {"type": "medium", "category": "emotional", "title": "Pratica de respiracao", "description": "Faca um exercicio de respiracao", "points": 20},
        {"type": "challenging", "category": "physical", "title": "Treino completo", "description": "Complete um treino de 30 minutos", "points": 40},
        {"type": "challenging", "category": "nutrition", "title": "Alimentacao perfeita", "description": "Siga 100% do seu plano alimentar", "points": 35},
        {"type": "challenging", "category": "emotional", "title": "Meditacao", "description": "Medite por pelo menos 15 minutos", "points": 30}
    ]'::jsonb;
    mission jsonb;
    mission_type_record record;
begin
    delete from public.daily_missions
     where user_id = p_user_id
       and mission_date = p_date;

    for mission_type_record in
        select distinct value->>'type' as mission_type
        from jsonb_array_elements(missions_data)
    loop
        select value into mission
          from jsonb_array_elements(missions_data) as elem(value)
         where elem.value->>'type' = mission_type_record.mission_type
         order by random()
         limit 1;

        insert into public.daily_missions (
            user_id, mission_date, mission_type, title,
            description, category, points_reward, target_value
        )
        values (
            p_user_id,
            p_date,
            mission->>'type',
            mission->>'title',
            mission->>'description',
            mission->>'category',
            (mission->>'points')::integer,
            '{}'::jsonb
        );
    end loop;
end;
$$;

grant execute on function public.generate_daily_missions_for_user(uuid, date)
    to anon, authenticated, service_role;

-- 5) Recreate safe_upsert_user_profile helper
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
    p_goal_type varchar(50) default null
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
        updated_at = now()
    returning * into result;

    return result;
end;
$$;

grant execute on function public.safe_upsert_user_profile(
    uuid, text, text, text, varchar, integer, integer, numeric, numeric, varchar, varchar, varchar
) to anon, authenticated, service_role;
