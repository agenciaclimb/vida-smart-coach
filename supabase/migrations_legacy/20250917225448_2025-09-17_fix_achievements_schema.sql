-- === Fix achievements schema (idempotente) ===

-- Garante colunas esperadas pelos seeds mais recentes
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS code           text,
  ADD COLUMN IF NOT EXISTS category       text,
  ADD COLUMN IF NOT EXISTS points_reward  integer,
  ADD COLUMN IF NOT EXISTS requirements   jsonb,
  ADD COLUMN IF NOT EXISTS is_active      boolean;

-- Defaults seguros (sem forçar NOT NULL para não quebrar dados legados)
ALTER TABLE public.achievements
  ALTER COLUMN icon           SET DEFAULT '🏆',
  ALTER COLUMN points_reward  SET DEFAULT 0,
  ALTER COLUMN category       SET DEFAULT 'milestone',
  ALTER COLUMN requirements   SET DEFAULT '{}'::jsonb,
  ALTER COLUMN is_active      SET DEFAULT true;

-- Índices/uniqueness por code (se já existir, mantém)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'ux_achievements_code'
  ) THEN
    -- evita erro se já houver UNIQUE implícito: cria só quando não existir
    BEGIN
      ALTER TABLE public.achievements
        ADD CONSTRAINT ux_achievements_code UNIQUE (code);
    EXCEPTION WHEN duplicate_object THEN
      -- ignora
      NULL;
    END;
  END IF;
END$$;
