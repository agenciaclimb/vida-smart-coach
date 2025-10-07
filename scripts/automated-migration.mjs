#!/usr/bin/env node

/**
 * Script de Migração Automatizada - Vida Smart Coach
 * Automatiza o processo de migração entre Supabase local e produção
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zzugbgoylwbaojdnunuz.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Diretório de migrações
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

/**
 * Lê todos os arquivos de migração
 */
function getMigrationFiles() {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Encontrados ${files.length} arquivos de migração`);
    return files;
  } catch (error) {
    console.error('❌ Erro ao ler diretório de migrações:', error.message);
    return [];
  }
}

/**
 * Verifica quais migrações já foram aplicadas
 */
async function getAppliedMigrations() {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('version');

    if (error) {
      console.log('⚠️ Tabela schema_migrations não existe, criando...');
      await createMigrationTable();
      return [];
    }

    return data.map(row => row.version);
  } catch (error) {
    console.error('❌ Erro ao verificar migrações aplicadas:', error.message);
    return [];
  }
}

/**
 * Cria a tabela de controle de migrações
 */
async function createMigrationTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (error) {
      console.error('❌ Erro ao criar tabela schema_migrations:', error.message);
    } else {
      console.log('✅ Tabela schema_migrations criada');
    }
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
  }
}

/**
 * Aplica uma migração específica
 */
async function applyMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const version = filename.replace('.sql', '');

  try {
    const migrationSQL = fs.readFileSync(filePath, 'utf8');
    console.log(`🔄 Aplicando migração: ${filename}`);

    // Executa a migração
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (migrationError) {
      console.error(`❌ Erro na migração ${filename}:`, migrationError.message);
      return false;
    }

    // Registra a migração como aplicada
    const { error: recordError } = await supabase
      .from('schema_migrations')
      .insert({ version });

    if (recordError) {
      console.error(`❌ Erro ao registrar migração ${filename}:`, recordError.message);
      return false;
    }

    console.log(`✅ Migração ${filename} aplicada com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar migração ${filename}:`, error.message);
    return false;
  }
}

/**
 * Executa todas as migrações pendentes
 */
async function runMigrations() {
  console.log('🚀 Iniciando processo de migração automatizada...\n');

  const migrationFiles = getMigrationFiles();
  if (migrationFiles.length === 0) {
    console.log('📭 Nenhum arquivo de migração encontrado');
    return;
  }

  const appliedMigrations = await getAppliedMigrations();
  console.log(`📊 Migrações já aplicadas: ${appliedMigrations.length}`);

  const pendingMigrations = migrationFiles.filter(file => {
    const version = file.replace('.sql', '');
    return !appliedMigrations.includes(version);
  });

  if (pendingMigrations.length === 0) {
    console.log('✅ Todas as migrações já foram aplicadas!');
    return;
  }

  console.log(`🔄 Migrações pendentes: ${pendingMigrations.length}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const migration of pendingMigrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    console.log(''); // Linha em branco para separar
  }

  console.log('📈 Resumo da migração:');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failureCount}`);
  console.log(`📊 Total processado: ${pendingMigrations.length}`);

  if (failureCount === 0) {
    console.log('\n🎉 Todas as migrações foram aplicadas com sucesso!');
  } else {
    console.log('\n⚠️ Algumas migrações falharam. Verifique os logs acima.');
  }
}

/**
 * Verifica a saúde do banco de dados
 */
async function healthCheck() {
  console.log('🏥 Verificando saúde do banco de dados...');

  try {
    // Testa conexão básica
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️ Erro na verificação de saúde:', error.message);
      return false;
    }

    console.log('✅ Banco de dados está saudável');
    return true;
  } catch (error) {
    console.error('❌ Erro na verificação de saúde:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🎯 Vida Smart Coach - Sistema de Migração Automatizada\n');

  // Verifica saúde do banco
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.log('❌ Banco de dados não está saudável. Abortando migrações.');
    process.exit(1);
  }

  // Executa migrações
  await runMigrations();

  console.log('\n🏁 Processo de migração concluído!');
}

// Executa o script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error.message);
    process.exit(1);
  });
}

export { runMigrations, healthCheck, getMigrationFiles, getAppliedMigrations };

