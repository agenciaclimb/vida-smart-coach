-- Ensure daily activities columns exist in production schema
set check_function_bodies = off;

alter table public.daily_activities
    add column if not exists bonus_type text,
    add column if not exists description text,
    add column if not exists metadata jsonb default '{}'::jsonb;

update public.daily_activities
   set bonus_type = coalesce(bonus_type, 'none')
 where bonus_type is null;

update public.daily_activities
   set description = coalesce(description, '')
 where description is null;

update public.daily_activities
   set metadata = coalesce(metadata, '{}'::jsonb)
 where metadata is null;

alter table public.daily_activities
    alter column metadata set default '{}'::jsonb;

-- Reinstate foreign keys for user_achievements
alter table public.user_achievements
    add column if not exists achievement_id uuid;

alter table public.user_achievements
    add column if not exists user_id uuid;

do $$
begin
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'user_achievements_achievement_id_fkey'
          and table_schema = 'public'
          and table_name = 'user_achievements'
    ) then
        alter table public.user_achievements
            add constraint user_achievements_achievement_id_fkey
            foreign key (achievement_id) references public.achievements(id) on delete cascade;
    end if;
end
$$;

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

create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);
create index if not exists idx_user_achievements_achievement_id on public.user_achievements(achievement_id);
