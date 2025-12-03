#!/usr/bin/env node
/**
 * Script para aplicar migration do sistema de métricas
 * Executa: node apply_metrics_migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Configure these in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Aplicando migration: Sistema de Métricas WhatsApp\n');

  try {
    // Ler arquivo SQL
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251203_create_whatsapp_metrics.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL carregado:', migrationPath);
    console.log(`📏 Tamanho: ${migrationSQL.length} bytes\n`);

    // Dividir em statements individuais (por ;)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Total de statements: ${statements.length}\n`);

    // Executar cada statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ') + '...';

      console.log(`[${i + 1}/${statements.length}] ${preview}`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Tentar executar direto via query
          const { error: directError } = await supabase
            .from('_migrations_temp')
            .select('*')
            .limit(0);
          
          // Como não podemos executar SQL arbitrário via REST API,
          // vamos usar uma abordagem diferente: executar via psql
          throw new Error('Direct SQL execution via REST API is not supported. Use Supabase Dashboard or psql.');
        }

        console.log(`  ✅ Success\n`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}\n`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 SUMMARY:`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. Apply migration manually:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Open file: supabase/migrations/20251203_create_whatsapp_metrics.sql');
      console.log('3. Run the SQL statements\n');
    } else {
      console.log('\n✅ Migration applied successfully!\n');
      console.log('🎯 Next steps:');
      console.log('1. Deploy evolution-webhook: supabase functions deploy evolution-webhook');
      console.log('2. Send test message via WhatsApp');
      console.log('3. Check metrics: SELECT * FROM v_whatsapp_performance_summary LIMIT 10;\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Executar
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║         SISTEMA DE MÉTRICAS WHATSAPP - MIGRATION             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

applyMigration().catch(console.error);
