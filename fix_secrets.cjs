// Script para remover todos os segredos expostos e substituir por variáveis de ambiente
const { readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const EXPOSED_KEYS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU1MTcwMSwiZXhwIjoyMDQ4MTI3NzAxfQ.U8Q8iJ2yKH-YfHMKwXdCf9_LRNG6f3jMpfGVVjwlhYY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxMjcyNDksImV4cCI6MjA0NzcwMzI0OX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE'
];

const DIRS_TO_SKIP = ['node_modules', 'dist', '.git', '.vercel', '.vscode', 'agent_outputs', 'logs'];
const FILES_TO_SKIP = ['.env.local', '.env.example', '.env.production', 'fix_secrets.cjs', 'package-lock.json', 'pnpm-lock.yaml'];

function getAllFiles(dirPath, filesList = []) {
  try {
    const files = readdirSync(dirPath);

    files.forEach(file => {
      const filePath = join(dirPath, file);
      
      try {
        if (statSync(filePath).isDirectory()) {
          if (!DIRS_TO_SKIP.includes(file)) {
            getAllFiles(filePath, filesList);
          }
        } else {
          const ext = file.split('.').pop();
          if (['js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'md'].includes(ext) && !FILES_TO_SKIP.includes(file)) {
            filesList.push(filePath);
          }
        }
      } catch (err) {
        // Ignorar erros de acesso a arquivos
      }
    });
  } catch (err) {
    // Ignorar erros de acesso a diretórios
  }

  return filesList;
}

function fixExposedSecrets() {
  console.log('🔒 Removendo segredos expostos dos arquivos...\n');

  const files = getAllFiles('.');
  let fixedCount = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8');
      let modified = false;

      for (const key of EXPOSED_KEYS) {
        if (content.includes(key)) {
          console.log(`⚠️  Segredo encontrado em: ${file}`);
          
          // Substituir por placeholder (não podemos saber o contexto exato)
          content = content.replaceAll(`'${key}'`, 'process.env.VITE_SUPABASE_ANON_KEY');
          content = content.replaceAll(`"${key}"`, 'process.env.VITE_SUPABASE_ANON_KEY');
          content = content.replaceAll(key, 'process.env.VITE_SUPABASE_ANON_KEY');
          
          modified = true;
        }
      }

      if (modified) {
        writeFileSync(file, content, 'utf-8');
        console.log(`✅ Corrigido: ${file}\n`);
        fixedCount++;
      }
    } catch (error) {
      // Ignorar erros de leitura/escrita
    }
  }

  console.log(`\n✅ ${fixedCount} arquivos corrigidos!`);
  console.log('\n⚠️  PRÓXIMOS PASSOS CRÍTICOS:');
  console.log('1. As chaves expostas foram comprometidas e precisam ser revogadas');
  console.log('2. Gere NOVAS chaves no Supabase (Settings > API)');
  console.log('3. Atualize .env.local com as novas chaves');
  console.log('4. Commit e push das correções');
  console.log('5. Revogue as chaves antigas no painel do Supabase\n');
}

fixExposedSecrets();
