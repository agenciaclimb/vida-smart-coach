-- Bootstrap auth user profile helpers before downstream triggers rely on them

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  region text,
  spirituality text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

-- minimal owner policies (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='perfil:owner read'
  ) then
    create policy "perfil:owner read" on public.user_profiles
      for select using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='perfil:owner write'
  ) then
    create policy "perfil:owner write" on public.user_profiles
      for update using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='perfil:self insert'
  ) then
    create policy "perfil:self insert" on public.user_profiles
      for insert with check (auth.uid() = id);
  end if;
end$$;

create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
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

-- Trigger creation handled in downstream migrations
create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if to_regclass('public.user_profiles') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='email') then
      update public.user_profiles set email = new.email where id = new.id;
    end if;
  elsif to_regclass('public.profiles') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email') then
      update public.profiles set email = new.email where id = new.id;
    end if;
  end if;
  return new;
end;
$$;
