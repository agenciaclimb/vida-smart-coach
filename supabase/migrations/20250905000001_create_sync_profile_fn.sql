-- Migration: Create sync_profile_from_auth function
-- Date: 2025-09-05
-- Reason: To provide the function needed by the 20250905000003_update_auth_triggers.sql migration.

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

-- Grant permissions
grant execute on function public.sync_profile_from_auth() to anon, authenticated, service_role;
