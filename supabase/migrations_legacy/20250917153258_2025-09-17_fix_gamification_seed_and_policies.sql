-- Corrige typos do seed de achievements (usa UPSERT idempotente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'achievements'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'code'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'requirements'
  ) THEN
    INSERT INTO achievements (code, name, description, icon, category, points_reward, requirements)
    VALUES
      ('weight_loss_5kg', 'Perdeu 5kg', 'Meta de perda de peso alcançada', '⚖️', 'milestone', 1000, jsonb_build_object('type', 'weight_loss', 'target', 5)),
      ('sugar_free_30_days', '30 Dias Sem Açúcar', 'Mês sem açúcar refinado', '🚫🍭', 'milestone', 1500, jsonb_build_object('type', 'no_sugar', 'target', 30))
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      category = EXCLUDED.category,
      points_reward = EXCLUDED.points_reward,
      requirements = EXCLUDED.requirements;
  ELSE
    RAISE NOTICE 'Achievements table or required columns missing; skipping seed fix.';
  END IF;
END;
$$;

-- Recria a policy que falhou (garante coluna antes e idempotência)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_event_participation' AND column_name = 'user_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_event_participation' AND policyname='Users can view own participation'
    ) THEN
      CREATE POLICY "Users can view own participation"
      ON public.user_event_participation
      FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END IF;
END$$;

-- (Opcional) garante RLS habilitado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_event_participation') THEN
    EXECUTE 'ALTER TABLE public.user_event_participation ENABLE ROW LEVEL SECURITY';
  END IF;
END$$;
