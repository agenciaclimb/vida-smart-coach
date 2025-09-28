import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERRO] Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variaveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const migrationPath = path.join('supabase', 'migrations', '20250915100000_add_missing_fields.sql');
  console.log('[INFO] Aplicando migration:', migrationPath);

  try {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    const statements = migrationSQL
      .split(/;\s*/)
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    let success = 0;

    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      console.log(`[INFO] Executando comando ${i + 1}/${statements.length}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error(`[ERRO] Falha no comando ${i + 1}:`, error.message);
      } else {
        success += 1;
      }
    }

    console.log(`[INFO] Comandos executados com sucesso: ${success}/${statements.length}`);
    console.log('[INFO] finalize verificando o resultado direto no Supabase.');
  } catch (error) {
    console.error('[ERRO] Nao foi possivel aplicar a migration:', error.message);
    process.exit(1);
  }
}

applyMigration();

