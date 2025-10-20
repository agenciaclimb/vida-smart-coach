-- Align legacy gamification tables used in production with the current app expectations
set check_function_bodies = off;

-- 1) daily_activities must expose activity_type and activity_date
alter table public.daily_activities
    add column if not exists activity_type text,
    add column if not exists activity_date date;

update public.daily_activities
   set activity_date = coalesce(activity_date, current_date)
 where activity_date is null;

update public.daily_activities
   set activity_type = coalesce(activity_type, 'unspecified')
 where activity_type is null;

alter table public.daily_activities
  alter column activity_date set default current_date,
  alter column activity_date set not null;

-- 2) user_achievements must expose user_id/achievement_id and FK references
alter table public.user_achievements
    add column if not exists user_id uuid,
    add column if not exists achievement_id uuid,
    add column if not exists earned_at timestamptz default now();

update public.user_achievements ua
   set user_id = up.id
  from public.user_profiles up
 where ua.user_id is null
   and up.phone is not null
   and ua.phone_number = up.phone;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
     where constraint_name = 'user_achievements_user_id_fkey'
       and table_schema = 'public'
       and table_name = 'user_achievements'
  ) then
    alter table public.user_achievements
      add constraint user_achievements_user_id_fkey
      foreign key (user_id) references public.user_profiles(id) on delete cascade;
  end if;
end
$$;

create index if not exists idx_user_achievements_user on public.user_achievements(user_id);

-- 3) Update RLS policy to rely on user_id column
drop policy if exists "Users can view own achievements" on public.user_achievements;
create policy "Users can view own achievements"
  on public.user_achievements
  for select
  using (auth.uid() = user_id);

-- 4) Refresh view to support both new and legacy columns gracefully
drop view if exists public.user_gamification_summary;

create view public.user_gamification_summary as
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
left join public.user_achievements ua
       on (ua.user_id = g.user_id)
       or (ua.user_id is null and ua.phone_number = up.phone)
group by g.user_id, up.name, up.email, g.total_points, g.level, g.current_streak,
         g.longest_streak, g.physical_points, g.nutrition_points, g.emotional_points,
         g.spiritual_points, g.referral_points, g.achievement_points, g.badges, g.updated_at;
