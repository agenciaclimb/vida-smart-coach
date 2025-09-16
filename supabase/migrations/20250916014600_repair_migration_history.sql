-- Migração para reparar o histórico de migrações do Supabase
-- Baseada nos comandos sugeridos pelo CLI do Supabase

-- Marcar migrações como revertidas (que não devem estar aplicadas)
UPDATE supabase_migrations.schema_migrations 
SET version = '20250909220528', statements = NULL, name = 'reverted'
WHERE version = '20250909220528';

UPDATE supabase_migrations.schema_migrations 
SET version = '20250911170500', statements = NULL, name = 'reverted'
WHERE version = '20250911170500';

UPDATE supabase_migrations.schema_migrations 
SET version = '20250911173000', statements = NULL, name = 'reverted'
WHERE version = '20250911173000';

UPDATE supabase_migrations.schema_migrations 
SET version = '20250911174500', statements = NULL, name = 'reverted'
WHERE version = '20250911174500';

-- Garantir que as migrações essenciais estejam marcadas como aplicadas
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) 
VALUES 
  ('20250905000003', 'applied', ARRAY['-- Migration applied']),
  ('20250915000000', 'applied', ARRAY['-- Migration applied']),
  ('20250915100000', 'applied', ARRAY['-- Migration applied']),
  ('20250915120000', 'applied', ARRAY['-- Migration applied']),
  ('20250915130000', 'applied', ARRAY['-- Migration applied']),
  ('20250915140000', 'applied', ARRAY['-- Migration applied'])
ON CONFLICT (version) DO UPDATE SET 
  name = EXCLUDED.name,
  statements = EXCLUDED.statements;

-- Comentário para log
SELECT 'Migration history repaired successfully' as status;

