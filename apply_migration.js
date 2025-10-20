import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  console.log('📝 Aplicando migração do banco de dados...\n');
  
  try {
    // Read migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250915100000_add_missing_fields.sql', 'utf8');
    
    console.log('🔧 SQL a ser executado:');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Split SQL into individual statements (simplified approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Executando ${statements.length} comandos SQL...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
        console.log(`${i + 1}. Executando: ${statement.substring(0, 60)}...`);
        
        try {
          // Try to execute via RPC (may not work with anon key for DDL)
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`   ❌ Falhou: ${error.message}`);
          } else {
            console.log(`   ✅ Sucesso`);
          }
        } catch (e) {
          console.log(`   ⚠️ Não executável via API: ${e.message}`);
        }
      }
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS MANUAIS:');
    console.log('Como a chave anon não permite alterações de schema (DDL),');
    console.log('você precisa executar a migração manualmente:');
    console.log('');
    console.log('1. Acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new');
    console.log('2. Cole o conteúdo do arquivo: supabase/migrations/20250915100000_add_missing_fields.sql');
    console.log('3. Execute o SQL');
    console.log('4. Aguarde a confirmação');
    console.log('');
    console.log('Ou use o Supabase CLI:');
    console.log('supabase migration up --include-all');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
  }
}

console.log('🚀 APLICANDO MIGRAÇÃO DE CAMPOS ESSENCIAIS\n');
applyMigration();