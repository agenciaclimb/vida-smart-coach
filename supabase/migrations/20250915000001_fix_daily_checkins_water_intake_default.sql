-- 🔧 FIX DAILY_CHECKINS WATER_INTAKE NOT NULL CONSTRAINT
-- 📍 Execute este SQL no Supabase Dashboard 
-- 🎯 Resolve erro 400 "null value in column 'water_intake'" no check-in

BEGIN;

-- garante valor padrão no servidor
ALTER TABLE public.daily_checkins
  ALTER COLUMN water_intake SET DEFAULT 0;

-- corrige registros legados (se existirem)
UPDATE public.daily_checkins
SET water_intake = 0
WHERE water_intake IS NULL;

-- mantém a regra NOT NULL (agora com default não quebra inserts)
ALTER TABLE public.daily_checkins
  ALTER COLUMN water_intake SET NOT NULL;

COMMIT;

-- ✅ VERIFICAÇÃO
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 WATER_INTAKE DEFAULT CONFIGURADO COM SUCESSO!';
    RAISE NOTICE '✅ Campo water_intake agora tem default 0';
    RAISE NOTICE '✅ Registros legados corrigidos';
    RAISE NOTICE '✅ Constraint NOT NULL mantida';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Check-in rápido deve funcionar sem erro 400';
END $$;