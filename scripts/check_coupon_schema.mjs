#!/usr/bin/env node
/**
 * Verifica o schema real da tabela reward_coupons
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Verificando schema de reward_coupons...\n');

  const { data, error } = await supabase
    .from('reward_coupons')
    .select('*')
    .limit(0);

  if (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Possível problema:');
    console.log('   - Tabela não existe ou migration não foi aplicada');
    console.log('   - Cache do Supabase desatualizado');
    console.log('\n📋 Solução:');
    console.log('   1. Executar novamente: node scripts/apply_via_management_api.mjs');
    console.log('   2. Ou aplicar manualmente no SQL Editor do Supabase');
  } else {
    console.log('✅ Tabela reward_coupons existe');
    console.log('\n📋 Para ver as colunas, execute no SQL Editor:');
    console.log(`
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reward_coupons'
AND table_schema = 'public'
ORDER BY ordinal_position;
    `);
  }
}

checkSchema();
