-- Final auth hardening: policies and safety checks
-- Date: 2025-09-09

-- Ensure Supabase Auth admin keeps required privileges
grant usage on schema public to supabase_auth_admin;
grant all on public.user_profiles to supabase_auth_admin;
grant all on public.gamification to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant execute on function public.sync_profile_from_auth() to supabase_auth_admin;

-- Refresh row level security policies for user_profiles
drop policy if exists "Users can view own profile" on user_profiles;
drop policy if exists "Users can insert own profile" on user_profiles;
drop policy if exists "Users can update own profile" on user_profiles;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Explicit full access for service role tokens
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Service role full access'
  ) then
    create policy "Service role full access"
      on public.user_profiles
      for all
      using (auth.jwt() ->> 'role' = 'service_role')
      with check (auth.jwt() ->> 'role' = 'service_role');
  end if;
end $$;

comment on function public.handle_new_user() is 'Creates or updates public.user_profiles when a new auth user is inserted.';
comment on function public.sync_profile_from_auth() is 'Keeps public.user_profiles aligned with auth.users updates.';

-- If triggers were dropped by previous deployments, restore them

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_updated'
  ) then
    create trigger on_auth_user_updated
      after update of email, phone, raw_user_meta_data, last_sign_in_at on auth.users
      for each row
      when (old.* is distinct from new.*)
      execute function public.sync_profile_from_auth();
  end if;
end $$;