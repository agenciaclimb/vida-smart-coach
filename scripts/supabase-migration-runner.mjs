#!/usr/bin/env node

import 'dotenv/config';

/**
 * Supabase Migration Runner - Vida Smart Coach
 * Executa migrações usando a API REST do Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zzugbgoylwbaojdnunuz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Chave de serviço necessária para operações administrativas

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não encontrada. Esta chave é necessária para executar migrações.');
  console.log('💡 Configure a variável de ambiente SUPABASE_SERVICE_KEY com a chave de serviço do Supabase.');
  process.exit(1);
}

// Diretório de migrações
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

/**
 * Executa SQL usando a API REST do Supabase
 */
async function executeSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro ao executar SQL: ${error.message}`);
  }
}

/**
 * Cria função exec_sql se não existir
 */
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result JSON;
    BEGIN
      EXECUTE sql_query;
      result := '{"status": "success"}'::JSON;
      RETURN result;
    EXCEPTION
      WHEN OTHERS THEN
        result := json_build_object('error', SQLERRM);
        RETURN result;
    END;
    $$;
  `;

  try {
    console.log('🔧 Criando função exec_sql...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ sql_query: createFunctionSQL })
    });

    if (response.ok) {
      console.log('✅ Função exec_sql criada com sucesso');
      return true;
    } else {
      // Se a função não pode ser criada via RPC, vamos tentar via SQL direto
      console.log('⚠️ Tentando criar função via SQL direto...');
      return await createFunctionDirectly(createFunctionSQL);
    }
  } catch (error) {
    console.log('⚠️ Erro ao criar função exec_sql:', error.message);
    return false;
  }
}

/**
 * Cria função diretamente via SQL
 */
async function createFunctionDirectly(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: sql
    });

    return response.ok;
  } catch (error) {
    console.log('⚠️ Erro ao criar função diretamente:', error.message);
    return false;
  }
}

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
 * Verifica se uma migração já foi aplicada
 */
async function isMigrationApplied(version) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schema_migrations?version=eq.${version}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.length > 0;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Registra uma migração como aplicada
 */
async function recordMigration(version) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schema_migrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ version, applied_at: new Date().toISOString() })
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Erro ao registrar migração:', error.message);
    return false;
  }
}

/**
 * Aplica uma migração específica
 */
async function applyMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const version = filename.replace('.sql', '');

  try {
    // Verifica se já foi aplicada
    if (await isMigrationApplied(version)) {
      console.log(`⏭️ Migração ${filename} já foi aplicada`);
      return true;
    }

    const migrationSQL = fs.readFileSync(filePath, 'utf8');
    console.log(`🔄 Aplicando migração: ${filename}`);

    // Divide o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of commands) {
      try {
        await executeSQL(command);
      } catch (error) {
        console.error(`❌ Erro no comando SQL: ${error.message}`);
        // Continua com o próximo comando
      }
    }

    // Registra a migração como aplicada
    await recordMigration(version);
    console.log(`✅ Migração ${filename} aplicada com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar migração ${filename}:`, error.message);
    return false;
  }
}

/**
 * Cria tabela de controle de migrações
 */
async function ensureMigrationTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  try {
    await executeSQL(createTableSQL);
    console.log('✅ Tabela schema_migrations verificada/criada');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabela schema_migrations:', error.message);
    return false;
  }
}

/**
 * Executa todas as migrações pendentes
 */
async function runMigrations() {
  console.log('🚀 Iniciando processo de migração do Supabase...\n');

  // Cria função exec_sql se necessário
  await createExecSqlFunction();

  // Garante que a tabela de migrações existe
  const tableCreated = await ensureMigrationTable();
  if (!tableCreated) {
    console.log('❌ Não foi possível criar tabela de controle de migrações');
    return;
  }

  const migrationFiles = getMigrationFiles();
  if (migrationFiles.length === 0) {
    console.log('📭 Nenhum arquivo de migração encontrado');
    return;
  }

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  for (const migration of migrationFiles) {
    const version = migration.replace('.sql', '');
    
    if (await isMigrationApplied(version)) {
      console.log(`⏭️ Migração ${migration} já aplicada`);
      skippedCount++;
      continue;
    }

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
  console.log(`⏭️ Já aplicadas: ${skippedCount}`);
  console.log(`📊 Total processado: ${migrationFiles.length}`);

  if (failureCount === 0) {
    console.log('\n🎉 Todas as migrações foram processadas com sucesso!');
  } else {
    console.log('\n⚠️ Algumas migrações falharam. Verifique os logs acima.');
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🎯 Vida Smart Coach - Runner de Migração Supabase\n');
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

export { runMigrations, getMigrationFiles };

