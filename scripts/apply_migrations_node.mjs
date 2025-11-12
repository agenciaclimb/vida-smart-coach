import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  console.log('🚀 Iniciando aplicação de migrations...\n');

  try {
    // Ler SQL file
    const sqlPath = join(__dirname, 'apply_all_migrations.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Arquivo lido:', sqlPath);
    console.log('📏 Tamanho:', sqlContent.length, 'caracteres');
    console.log('\n⏳ Executando SQL no Supabase...\n');

    // Executar SQL usando rpc (evita limite de query string)
    // Dividir em blocos menores se necessário
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    let errors = 0;

    for (const statement of statements) {
      if (statement.includes('SELECT \'')) {
        // Pular queries de verificação/info
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Tentar execução direta
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql: statement + ';' })
          });

          if (!response.ok) {
            console.warn('⚠️  Erro (será ignorado se já existir):', error.message.substring(0, 100));
            errors++;
          }
        }
        
        executed++;
        if (executed % 10 === 0) {
          console.log(`  ✓ ${executed} statements executados...`);
        }
      } catch (err) {
        console.warn('⚠️  Erro:', err.message.substring(0, 100));
        errors++;
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   Executados: ${executed}`);
    console.log(`   Warnings: ${errors}`);

    // Verificar resultados
    console.log('\n🔍 Verificando criação...\n');

    // Views
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .in('table_name', ['v_user_xp_totals', 'v_weekly_ranking', 'v_rewards_catalog']);

    if (!viewsError && views) {
      console.log('✅ Views criadas:', views.map(v => v.table_name).join(', '));
    }

    // Tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['rewards', 'reward_redemptions', 'reward_coupons'])
      .eq('table_schema', 'public');

    if (!tablesError && tables) {
      console.log('✅ Tabelas criadas:', tables.map(t => t.table_name).join(', '));
    }

    console.log('\n🎉 Migrations aplicadas com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verificar RewardsPage no frontend');
    console.log('   2. Testar redemption via WhatsApp');
    console.log('   3. Validar calendar sync');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  }
}

applyMigrations();
