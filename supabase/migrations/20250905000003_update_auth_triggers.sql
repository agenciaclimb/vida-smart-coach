-- Canonical auth triggers and helper functions (Stripe/Auth consolidation)
create extension if not exists "pg_net" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;

-- Ensure Stripe customer metadata fields exist
alter table public.user_profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_current_period_end timestamptz;

create index if not exists idx_user_profiles_stripe_customer_id on public.user_profiles(stripe_customer_id);

-- Helper: create or update profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    'Usuario'
  );
  v_email text := coalesce(
    new.email,
    'user' || substr(new.id::text, 1, 8) || '@temp.local'
  );
  v_phone text := coalesce(
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'phone'
  );
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'client');
  v_activity text := coalesce(new.raw_user_meta_data->>'activity_level', 'moderate');
  v_onboarding boolean := coalesce((new.raw_user_meta_data->>'onboarding_completed')::boolean, false);
begin
  insert into public.user_profiles (
    id,
    name,
    full_name,
    email,
    phone,
    whatsapp,
    activity_level,
    role,
    onboarding_completed,
    created_at,
    updated_at
  )
  values (
    new.id,
    v_full_name,
    v_full_name,
    v_email,
    v_phone,
    v_phone,
    v_activity,
    v_role,
    v_onboarding,
    now(),
    now()
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, user_profiles.name),
    full_name = coalesce(excluded.full_name, user_profiles.full_name),
    email = coalesce(excluded.email, user_profiles.email),
    phone = coalesce(excluded.phone, user_profiles.phone),
    whatsapp = coalesce(excluded.whatsapp, user_profiles.whatsapp),
    activity_level = coalesce(excluded.activity_level, user_profiles.activity_level),
    role = coalesce(excluded.role, user_profiles.role),
    onboarding_completed = excluded.onboarding_completed,
    updated_at = now();

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

comment on function public.handle_new_user() is 'Creates or updates public.user_profiles when a new auth user is inserted.';

grant usage on schema public to supabase_auth_admin;
grant all on public.user_profiles to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Helper: sync profile changes when auth.users is updated
create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    'Usuario'
  );
  v_email text := coalesce(
    new.email,
    'user' || substr(new.id::text, 1, 8) || '@temp.local'
  );
  v_phone text := coalesce(
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'phone'
  );
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'client');
  v_activity text := coalesce(new.raw_user_meta_data->>'activity_level', 'moderate');
  v_onboarding boolean := coalesce((new.raw_user_meta_data->>'onboarding_completed')::boolean, false);
begin
  insert into public.user_profiles (
    id,
    name,
    full_name,
    email,
    phone,
    whatsapp,
    activity_level,
    role,
    onboarding_completed,
    created_at,
    updated_at
  )
  values (
    new.id,
    v_full_name,
    v_full_name,
    v_email,
    v_phone,
    v_phone,
    v_activity,
    v_role,
    v_onboarding,
    now(),
    now()
  )
  on conflict (id) do update set
    name = coalesce(v_full_name, user_profiles.name),
    full_name = coalesce(v_full_name, user_profiles.full_name),
    email = coalesce(v_email, user_profiles.email),
    phone = coalesce(v_phone, user_profiles.phone),
    whatsapp = coalesce(v_phone, user_profiles.whatsapp),
    activity_level = coalesce(v_activity, user_profiles.activity_level),
    role = coalesce(v_role, user_profiles.role),
    onboarding_completed = v_onboarding,
    updated_at = now();

  return new;
exception
  when others then
    raise warning 'sync_profile_from_auth failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

comment on function public.sync_profile_from_auth() is 'Keeps public.user_profiles aligned with auth.users updates.';

grant execute on function public.sync_profile_from_auth() to supabase_auth_admin;

-- Triggers (drop old versions to avoid duplicates)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create trigger on_auth_user_updated
  after update of email, phone, raw_user_meta_data, last_sign_in_at on auth.users
  for each row
  when (old.* is distinct from new.*)
  execute function public.sync_profile_from_auth();