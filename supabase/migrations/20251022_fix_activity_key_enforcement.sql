-- Fix idempotente para enforcement de activity_key sob índice único já existente
-- Estratégia: deduplicar usando chave derivada (sem atualizar colunas antes), depois backfill seguro

-- Garantir coluna
ALTER TABLE public.daily_activities
  ADD COLUMN IF NOT EXISTS activity_key text;

-- Deduplicar com chave derivada (sem violar índice existente)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id,
                   activity_date,
                   CASE activity_name
                     WHEN 'Check-in de treino' THEN 'quick-checkin-treino'
                     WHEN 'Meta de água' THEN 'quick-meta-agua'
                     WHEN 'Check-in de humor' THEN 'quick-checkin-humor'
                     WHEN 'Reflexão diária' THEN 'quick-reflexao-diaria'
                     ELSE activity_key
                   END
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.daily_activities
)
DELETE FROM public.daily_activities da
USING ranked r
WHERE da.id = r.id
  AND r.rn > 1;

-- Backfill determinístico (apenas onde estiver NULL)
UPDATE public.daily_activities
SET activity_key = CASE activity_name
  WHEN 'Check-in de treino' THEN 'quick-checkin-treino'
  WHEN 'Meta de água' THEN 'quick-meta-agua'
  WHEN 'Check-in de humor' THEN 'quick-checkin-humor'
  WHEN 'Reflexão diária' THEN 'quick-reflexao-diaria'
  ELSE activity_key
END
WHERE activity_key IS NULL
  AND activity_name IN (
    'Check-in de treino',
    'Meta de água',
    'Check-in de humor',
    'Reflexão diária'
  );

-- Garantir índice único (pode já existir)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_daily_activity_key_per_day
  ON public.daily_activities (user_id, activity_date, activity_key)
  WHERE activity_key IS NOT NULL;

COMMENT ON INDEX public.uniq_daily_activity_key_per_day IS
  'Prevents duplicate activities per user/day when activity_key is provided.';
