-- ?? FIX DAILY_CHECKINS WATER_INTAKE NOT NULL CONSTRAINT (IDEMPOTENT)
-- ?? Execute este SQL no Supabase Dashboard 
-- ?? Resolve erro 400 "null value in column 'water_intake'" no check-in

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_checkins' AND column_name = 'water_intake') THEN
    ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET DEFAULT 0;

    UPDATE public.daily_checkins
    SET water_intake = 0
    WHERE water_intake IS NULL;

    ALTER TABLE public.daily_checkins ALTER COLUMN water_intake SET NOT NULL;
    RAISE NOTICE 'water_intake default 0 configured successfully';
  ELSE
    RAISE NOTICE 'Skipping water_intake migration: column does not exist on public.daily_checkins.';
  END IF;
END $$;

-- ? VERIFICAÇÃO
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_checkins' AND column_name = 'water_intake') THEN
    RAISE NOTICE '';
    RAISE NOTICE '?? WATER_INTAKE DEFAULT CONFIGURADO COM SUCESSO!';
    RAISE NOTICE '? Campo water_intake agora tem default 0';
    RAISE NOTICE '? Registros legados corrigidos';
    RAISE NOTICE '? Constraint NOT NULL mantida';
    RAISE NOTICE '';
    RAISE NOTICE '?? Check-in rápido deve funcionar sem erro 400';
  ELSE
    RAISE NOTICE 'Skipping water_intake verification: column does not exist.';
  END IF;
END $$;
