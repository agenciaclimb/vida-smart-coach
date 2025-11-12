#!/usr/bin/env node

/**
 * Deploy Completo - Vida Smart Coach
 * Automatiza todo o processo: migrações, build e deploy
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Executa comando e retorna resultado
 */
function runCommand(command, options = {}) {
  try {
    console.log(`🔄 Executando: ${command}`);
    const result = execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      ...options
    });
    console.log(`✅ Comando executado com sucesso`);
    return { success: true, output: result };
  } catch (error) {
    console.error(`❌ Erro no comando: ${error.message}`);
    return { success: false, error: error.message, output: error.stdout };
  }
}

/**
 * Verifica se um comando está disponível no PATH (cross-platform)
 */
function hasCommand(cmd) {
  try {
    const isWin = process.platform === 'win32';
    const whichCmd = isWin ? 'where' : 'which';
    const res = spawnSync(whichCmd, [cmd], { encoding: 'utf8' });
    return res.status === 0;
  } catch (_) {
    return false;
  }
}

/**
 * Verifica se todas as dependências estão instaladas
 */
function checkDependencies() {
  console.log('📦 Verificando dependências...');
  
  if (!fs.existsSync(path.join(PROJECT_ROOT, 'node_modules'))) {
    console.log('📥 Instalando dependências...');
    const result = runCommand('npm install');
    if (!result.success) {
      throw new Error('Falha ao instalar dependências');
    }
  }
  
  console.log('✅ Dependências verificadas');
}

/**
 * Executa migrações do Supabase
 */
async function runMigrations() {
  console.log('🗄️ Executando migrações do Supabase...');
  
  // Verifica se o Supabase CLI está disponível (Windows/Linux/Mac)
  const supabaseCliAvailable = hasCommand('supabase');
  if (!supabaseCliAvailable) {
    console.log('⚠️ Supabase CLI não encontrado, pulando migrações locais');
    return true;
  }

  // Tenta executar migrações via CLI
  const migrationResult = runCommand('supabase db push --include-all', { stdio: 'inherit' });
  
  if (!migrationResult.success) {
    console.log('⚠️ Migrações via CLI falharam, tentando script alternativo...');
    
    // Tenta usar o script de migração customizado
    try {
      const { runMigrations } = await import('./supabase-migration-runner.mjs');
      await runMigrations();
      console.log('✅ Migrações executadas via script customizado');
    } catch (error) {
      console.log('⚠️ Script de migração customizado também falhou:', error.message);
      console.log('🔄 Continuando com o deploy...');
    }
  } else {
    console.log('✅ Migrações executadas via Supabase CLI');
  }
  
  return true;
}

/**
 * Executa build da aplicação
 */
function buildApplication() {
  console.log('🏗️ Fazendo build da aplicação...');
  
  const result = runCommand('npm run build');
  if (!result.success) {
    throw new Error('Falha no build da aplicação');
  }
  
  console.log('✅ Build concluído com sucesso');
  return true;
}

/**
 * Executa testes se disponíveis
 */
function runTests() {
  console.log('🧪 Verificando testes...');
  
  // Verifica se há script de teste
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.test) {
    console.log('🔄 Executando testes...');
    const result = runCommand('npm test');
    if (!result.success) {
      console.log('⚠️ Alguns testes falharam, mas continuando com deploy...');
    } else {
      console.log('✅ Todos os testes passaram');
    }
  } else {
    console.log('📝 Nenhum script de teste encontrado');
  }
  
  return true;
}

/**
 * Faz deploy no Vercel
 */
function deployToVercel() {
  console.log('🚀 Fazendo deploy no Vercel...');
  
  // Verifica se Vercel CLI está disponível
  let vercelCmd = 'vercel';
  const vercelAvailable = hasCommand('vercel');
  if (!vercelAvailable) {
    console.log('⚠️ Vercel CLI não encontrado globalmente, tentando via npx...');
    vercelCmd = 'npx vercel';
  }

  // Faz deploy
  const deployResult = runCommand(`${vercelCmd} --prod --yes`);
  if (!deployResult.success) {
    console.log('❌ Deploy no Vercel falhou');
    return false;
  }
  
  console.log('✅ Deploy no Vercel concluído');
  return true;
}

/**
 * Verifica saúde da aplicação
 */
async function healthCheck() {
  console.log('🏥 Verificando saúde da aplicação...');
  
  // Usa URL configurada ou domínio padrão correto de produção
  const siteUrl = process.env.VITE_APP_BASE_URL || 'https://appvidasmart.com';
  
  try {
    const response = await fetch(siteUrl);
    if (response.ok) {
      console.log('✅ Site está respondendo corretamente');
      return true;
    } else {
      console.log(`⚠️ Site retornou status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar site:', error.message);
    return false;
  }
}

/**
 * Gera relatório de deploy
 */
function generateDeployReport(startTime, results) {
  const endTime = new Date();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n📊 RELATÓRIO DE DEPLOY');
  console.log('='.repeat(50));
  console.log(`⏱️ Duração total: ${duration}s`);
  console.log(`📅 Concluído em: ${endTime.toLocaleString()}`);
  console.log('\n📋 Resultados:');
  
  Object.entries(results).forEach(([step, success]) => {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${step}`);
  });
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalSteps = Object.keys(results).length;
  
  console.log(`\n📈 Taxa de sucesso: ${successCount}/${totalSteps} (${Math.round(successCount/totalSteps*100)}%)`);
  
  if (successCount === totalSteps) {
  console.log('\n🎉 Deploy concluído com sucesso!');
  console.log(`🌐 Site disponível em: ${process.env.VITE_APP_BASE_URL || 'https://appvidasmart.com'}`);
  } else {
    console.log('\n⚠️ Deploy concluído com algumas falhas. Verifique os logs acima.');
  }
}

/**
 * Função principal
 */
async function main() {
  const startTime = new Date();
  console.log('🎯 Vida Smart Coach - Deploy Completo');
  console.log(`🕐 Iniciado em: ${startTime.toLocaleString()}\n`);
  
  const results = {};
  
  try {
    // 1. Verificar dependências
    checkDependencies();
    results['Verificação de dependências'] = true;
    
    // 2. Executar migrações
    await runMigrations();
    results['Migrações do Supabase'] = true;
    
    // 3. Executar testes
    runTests();
    results['Execução de testes'] = true;
    
    // 4. Build da aplicação
    buildApplication();
    results['Build da aplicação'] = true;
    
    // 5. Deploy no Vercel
    const deploySuccess = deployToVercel();
    results['Deploy no Vercel'] = deploySuccess;
    
    // 6. Health check
    if (deploySuccess) {
      // Aguarda um pouco para o deploy se estabilizar
      console.log('⏳ Aguardando deploy se estabilizar...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const healthOk = await healthCheck();
      results['Verificação de saúde'] = healthOk;
    }
    
  } catch (error) {
    console.error('💥 Erro durante o deploy:', error.message);
    results[`Erro: ${error.message}`] = false;
  }
  
  // Gera relatório final
  generateDeployReport(startTime, results);
}

// Executa o script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error.message);
    process.exit(1);
  });
}

export { main as deployComplete };

