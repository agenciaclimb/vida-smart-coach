// Script para remover todos os segredos expostos e substituir por variáveis de ambiente
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const EXPOSED_KEYS = [
  process.env.VITE_SUPABASE_ANON_KEY,
  process.env.VITE_SUPABASE_ANON_KEY,
  process.env.VITE_SUPABASE_ANON_KEY,
  'sb_secret_F3HUJCLX2VdRiuah8bAMlQ_hhn0gyC8'
];

const FILES_TO_SKIP = [
  '.env.local',
  '.env.example',
  '.env.production',
  'fix_exposed_secrets.js',
  'node_modules/**',
  'dist/**',
  '.git/**'
];

async function fixExposedSecrets() {
  console.log('🔒 Removendo segredos expostos dos arquivos...\n');

  const files = await glob('**/*.{js,mjs,cjs,ts,md}', { 
    ignore: FILES_TO_SKIP,
    nodir: true 
  });

  let fixedCount = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8');
      let modified = false;

      for (const key of EXPOSED_KEYS) {
        if (content.includes(key)) {
          console.log(`⚠️  Segredo encontrado em: ${file}`);
          
          // Substituir por variável de ambiente apropriada
          if (key.includes('service_role')) {
            content = content.replaceAll(key, 'process.env.SUPABASE_SERVICE_ROLE_KEY');
          } else if (key.includes('sb_secret')) {
            content = content.replaceAll(key, 'process.env.SUPABASE_SERVICE_ROLE_KEY');
          } else {
            content = content.replaceAll(key, 'process.env.VITE_SUPABASE_ANON_KEY');
          }
          
          modified = true;
        }
      }

      if (modified) {
        writeFileSync(file, content, 'utf-8');
        console.log(`✅ Corrigido: ${file}\n`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${file}:`, error.message);
    }
  }

  console.log(`\n✅ ${fixedCount} arquivos corrigidos!`);
  console.log('\n⚠️  PRÓXIMOS PASSOS CRÍTICOS:');
  console.log('1. Revise as alterações com: git diff');
  console.log('2. Gere NOVAS chaves no Supabase (as expostas foram comprometidas)');
  console.log('3. Atualize .env.local com as novas chaves');
  console.log('4. Commit e push das correções');
  console.log('5. Revogue as chaves antigas no painel do Supabase\n');
}

fixExposedSecrets().catch(console.error);
