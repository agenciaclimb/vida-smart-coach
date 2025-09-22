-- === CODEX FIX PACK ===
-- 1) Função + trigger de novo usuário (idempotente e com defaults seguros)
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
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end$$;

grant execute on function public.handle_new_user() to authenticated, anon;

-- 2) Seeds/ajustes de achievements (corrige typos e deixa idempotente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'achievements'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'code'
  ) THEN
    INSERT INTO public.achievements (code, name, description, icon, category, points_reward, requirements)
    VALUES
      ('weight_loss_5kg','Perdeu 5kg','Meta de perda de peso alcançada','⚖️','milestone',1000,$req${"type":"weight_loss","target":5}$req$::jsonb),
      ('sugar_free_30_days','30 Dias Sem Açúcar','Mês sem açúcar refinado','🚫🍭','milestone',1500,$req${"type":"no_sugar","target":30}$req$::jsonb)
    ON CONFLICT (code) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      points_reward = excluded.points_reward,
      requirements = excluded.requirements;
  ELSE
    RAISE NOTICE 'Achievements table missing; skipping seed adjustments.';
  END IF;
END;
$$;

-- 3) Policies e RLS garantidos (idempotentes)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='user_event_participation'
  ) then
    execute 'alter table public.user_event_participation enable row level security';
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='user_event_participation'
        and policyname='Users can view own participation'
    ) then
      execute 'create policy "Users can view own participation"
               on public.user_event_participation
               for select using (auth.uid() = user_id)';
    end if;
  end if;
end$$;

-- 4) Index defensivo (só cria se coluna existir)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='leaderboards' and column_name='points'
  ) then
    execute 'create index if not exists idx_leaderboards_points on public.leaderboards(points desc)';
  end if;
end$$;


