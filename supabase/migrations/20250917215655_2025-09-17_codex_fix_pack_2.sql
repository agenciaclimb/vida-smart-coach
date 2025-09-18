-- 2) Seeds/ajustes de achievements (idempotente)
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
      ('weight_loss_5kg','Perdeu 5kg','Meta de perda de peso alcançada','⚖️','milestone',1000,'{""type"":""weight_loss"",""target"":5}'),
      ('sugar_free_30_days','30 Dias Sem Açúcar','Mês sem açúcar refinado','🚫🍭','milestone',1500,'{""type"":""no_sugar"",""target"":30}')
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

-- 3) Policy + RLS garantidos (idempotente)
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='user_event_participation') then
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

-- 4) Índice defensivo (só cria se coluna existir)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='leaderboards'
               and column_name='points') then
    execute 'create index if not exists idx_leaderboards_points on public.leaderboards(points desc)';
  end if;
end$$;

