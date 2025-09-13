-- ===============================================
-- 🔍 CHECKS RÁPIDOS - VERIFICAÇÃO DAS VIEWS
-- ===============================================

-- 2.4 Checks rápidos

-- Deve retornar linhas agrupadas por tipo
SELECT 
  type, 
  COUNT(*) as total_records 
FROM public.public_app_plans 
GROUP BY type 
ORDER BY type;

-- Amostras da view principal
SELECT 
  type,
  id,
  owner_id,
  title,
  CASE WHEN plan IS NOT NULL THEN 'HAS_PLAN' ELSE 'NO_PLAN' END as plan_status,
  created_at
FROM public.public_app_plans 
LIMIT 5;

-- Verificar view de compatibilidade
SELECT 
  type,
  COUNT(*) as count
FROM public.public_plans 
GROUP BY type
LIMIT 5;

-- Se community existe, verificar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'public_community' AND table_schema = 'public') THEN
    RAISE NOTICE 'View public_community existe - verificando...';
    PERFORM * FROM public.public_community LIMIT 1;
    RAISE NOTICE 'View public_community OK';
  ELSE
    RAISE NOTICE 'View public_community não existe (normal se não há community_posts)';
  END IF;
END $$;

-- Verificar grants
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'public_app_plans' 
  AND table_schema = 'public'
  AND grantee = 'authenticated';

-- Status das tabelas base
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables t2 
    WHERE t2.table_name = t.table_name 
    AND t2.table_schema = 'public'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (
  VALUES 
    ('nutrition_plans'),
    ('training_plans'),
    ('plan_days'),
    ('plans'),
    ('community_posts'),
    ('rewards')
) t(table_name);

-- Contagem final
SELECT 
  'public_app_plans' as view_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT type) as distinct_types,
  COUNT(DISTINCT owner_id) as distinct_owners
FROM public.public_app_plans;