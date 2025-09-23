DO 
BEGIN
  IF to_regclass('public.achievements') IS NOT NULL THEN
    PERFORM 1 FROM public.achievements LIMIT 1;
    RAISE NOTICE 'OK: achievements acessível.';
  ELSE
    RAISE NOTICE 'PULADO: achievements não existe.';
  END IF;
END;
