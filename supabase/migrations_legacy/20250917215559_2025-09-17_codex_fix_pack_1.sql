-- 1) Função + trigger de novo usuário (idempotente)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id, name, full_name, email, activity_level, role, created_at, updated_at
  )
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'full_name',
    coalesce(NEW.email, 'user' || substr(NEW.id::text,1,8) || '@temp.local'),
    coalesce(NEW.raw_user_meta_data->>'activity_level', 'moderate'),
    coalesce(NEW.raw_user_meta_data->>'role', 'client'),
    now(), now()
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, user_profiles.name),
    full_name = coalesce(excluded.full_name, user_profiles.full_name),
    email = coalesce(excluded.email, user_profiles.email),
    updated_at = now();

  insert into public.gamification (user_id, level, xp, coins, streak, created_at, updated_at)
  values (NEW.id, 1, 0, 0, 0, now(), now())
  on conflict (user_id) do nothing;

  return NEW;
exception when others then
  raise warning 'Error in handle_new_user trigger: %', SQLERRM;
  return NEW;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end$$;

grant execute on function public.handle_new_user() to authenticated, anon;
