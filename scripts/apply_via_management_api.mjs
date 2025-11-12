import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef || !accessToken) {
  console.error('❌ Variáveis não configuradas');
  console.error('SUPABASE_PROJECT_REF:', projectRef ? '✓' : '✗');
  console.error('SUPABASE_ACCESS_TOKEN:', accessToken ? '✓' : '✗');
  process.exit(1);
}

console.log('🚀 APLICANDO MIGRATIONS VIA API MANAGEMENT\n');
console.log('📍 Project:', projectRef);
console.log('🔑 Token:', accessToken.substring(0, 15) + '...\n');

async function executeSQLViaAPI() {
  try {
    // Ler arquivo SQL
    const sqlPath = join(__dirname, 'apply_all_migrations.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL lido:', sqlContent.length, 'caracteres\n');
    console.log('⏳ Executando via Supabase Management API...\n');

    // Executar SQL via API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: sqlContent
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na API:', result);
      throw new Error(result.message || 'Erro desconhecido');
    }

    console.log('✅ SQL executado com sucesso!\n');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2).substring(0, 500));

    console.log('\n🎉 DEPLOY COMPLETO!\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

executeSQLViaAPI();
