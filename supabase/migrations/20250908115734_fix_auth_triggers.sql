-- === Fix definitivo dos gatilhos de auth.users -> perfil (profiles ou user_profiles) ===

-- 1) Função: cria o registro de perfil ao inserir em auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_email_col boolean := false;
begin
  if to_regclass('public.user_profiles') is not null then
    insert into public.user_profiles (id) values (new.id)
    on conflict (id) do nothing;

    select exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='user_profiles' and column_name='email'
    ) into has_email_col;

    if has_email_col then
      update public.user_profiles set email = coalesce(email, new.email) where id = new.id;
    end if;

  elsif to_regclass('public.profiles') is not null then
    insert into public.profiles (id) values (new.id)
    on conflict (id) do nothing;

    select exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='profiles' and column_name='email'
    ) into has_email_col;

    if has_email_col then
      update public.profiles set email = coalesce(email, new.email) where id = new.id;
    end if;
  end if;

  return new;
end;
$$;

-- 2) Função: sincroniza e-mail quando auth.users.email for atualizado
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

-- 3) (Re)cria triggers em auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_from_auth();

-- 4) Garante RLS e policies mínimas na tabela de perfil existente
do $$
begin
  if to_regclass('public.user_profiles') is not null then
    execute 'alter table public.user_profiles enable row level security';
    if exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='up_select_own') then
      execute 'drop policy "up_select_own" on public.user_profiles';
    end if;
    execute 'create policy "up_select_own" on public.user_profiles for select using (auth.uid() = id)';

    if exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='up_update_own') then
      execute 'drop policy "up_update_own" on public.user_profiles';
    end if;
    execute 'create policy "up_update_own" on public.user_profiles for update using (auth.uid() = id)';

    if exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='up_insert_own') then
      execute 'drop policy "up_insert_own" on public.user_profiles';
    end if;
    execute 'create policy "up_insert_own" on public.user_profiles for insert with check (auth.uid() = id)';
  end if;

  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';
    if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='p_select_own') then
      execute 'drop policy "p_select_own" on public.profiles';
    end if;
    execute 'create policy "p_select_own" on public.profiles for select using (auth.uid() = id)';

    if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='p_update_own') then
      execute 'drop policy "p_update_own" on public.profiles';
    end if;
    execute 'create policy "p_update_own" on public.profiles for update using (auth.uid() = id)';

    if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='p_insert_own') then
      execute 'drop policy "p_insert_own" on public.profiles';
    end if;
    execute 'create policy "p_insert_own" on public.profiles for insert with check (auth.uid() = id)';
  end if;
end $$;

-- 5) Permissões mínimas para execução das funções
grant usage on schema public to anon, authenticated, service_role;
grant execute on function public.handle_new_user() to anon, authenticated, service_role;
grant execute on function public.sync_profile_from_auth() to anon, authenticated, service_role;
