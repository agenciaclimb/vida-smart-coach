-- Garantir extensão pgcrypto (se ainda não existir) para UUID/ops comuns
create extension if not exists pgcrypto;

-- 1) Tabela e RLS (defensivo – caso algum ambiente novo rode do zero)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  region text,
  spirituality text,
  created_at timestamptz default now()
);
alter table public.user_profiles enable row level security;

-- Policies mínimas para dono
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

-- 2) Funções idempotentes (criam/atualizam)
create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''))
  on conflict (id) do update
    set full_name = excluded.full_name,
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
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''))
  on conflict (id) do update
    set full_name = excluded.full_name,
        updated_at = now();
  return new;
end;
$$;

-- 3) (Re)criar trigger com ordem correta
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.on_auth_user_created();
