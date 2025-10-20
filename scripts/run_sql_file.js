// Utilitário para executar um arquivo .sql no banco do Supabase.
// Suporta dois modos:
// 1. Conexão direta usando credenciais Postgres (recomendado). Requer SUPABASE_DB_PASSWORD.
// 2. Fallback via RPC exec_sql (caso disponível).

import { createClient } from '@supabase/supabase-js';
import { Client as PgClient } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

try {
  const localEnv = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else {
    dotenv.config();
  }
} catch {
  // Ignora erro de dotenv
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Uso: node scripts/run_sql_file.js <caminho_para_arquivo.sql>');
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(absPath)) {
    console.error(`Arquivo não encontrado: ${absPath}`);
    process.exit(1);
  }

  const sqlRaw = fs.readFileSync(absPath, 'utf-8');
  const preferDirectPg = Boolean(process.env.SUPABASE_DB_PASSWORD);

  if (preferDirectPg) {
    console.log(`🔧 Executando SQL completo via conexão direta (pg): ${absPath}`);
    try {
      await executeWithPg(sqlRaw);
      console.log('\n✅ Migração aplicada com sucesso via conexão direta.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro na execução direta via pg:', error.message || error);
      console.error('➡️ Tentando fallback via RPC exec_sql (se disponível)...\n');
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://zzugbgoylwbaojdnunuz.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const statements = splitStatements(sqlRaw);

  console.log(`🔧 Executando ${statements.length} statements via RPC exec_sql: ${absPath}`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 120);
    console.log(`\n🧾 [${i + 1}/${statements.length}] ${preview}${stmt.length > 120 ? '…' : ''}`);
    try {
      let { error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        const fb = await supabase.rpc('exec_sql', { sql_query: stmt });
        error = fb.error;
      }
      if (error) {
        console.error('   ❌ Erro:', error.message || error);
        failed++;
      } else {
        console.log('   ✅ Sucesso');
        success++;
      }
    } catch (e) {
      console.error('   ❌ Exceção ao executar:', e.message);
      failed++;
    }
  }

  console.log(`\n📊 Resultado: ${success} ok, ${failed} falhas`);
  process.exit(failed > 0 ? 2 : 0);
}

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let dollarTag = null;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextTwo = sql.slice(i, i + 2);

    if (!inSingle && !inDouble && !dollarTag && nextTwo === '--') {
      const end = sql.indexOf('\n', i);
      if (end === -1) {
        current += sql.slice(i);
        break;
      } else {
        current += sql.slice(i, end + 1);
        i = end;
        continue;
      }
    }

    if (!inSingle && !inDouble && !dollarTag && nextTwo === '/*') {
      const end = sql.indexOf('*/', i + 2);
      const block = end === -1 ? sql.slice(i) : sql.slice(i, end + 2);
      current += block;
      i = end === -1 ? sql.length : end + 1;
      continue;
    }

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = null;
        continue;
      }
      current += char;
      continue;
    }

    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      current += char;
      continue;
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      current += char;
      continue;
    }

    if (!inSingle && !inDouble && char === '$') {
      const tagMatch = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (tagMatch) {
        dollarTag = tagMatch[0];
        current += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    }

    if (!inSingle && !inDouble && char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const final = current.trim();
  if (final.length > 0) {
    statements.push(final);
  }

  return statements;
}

async function executeWithPg(sqlRaw) {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    throw new Error('SUPABASE_DB_PASSWORD não definido.');
  }

  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const defaultHost = projectRef ? `db.${projectRef}.supabase.co` : null;
  const dbHost = process.env.SUPABASE_DB_HOST || defaultHost;
  if (!dbHost) {
    throw new Error('Host do banco não identificado. Configure SUPABASE_PROJECT_REF ou SUPABASE_DB_HOST.');
  }

  const dbPort = process.env.SUPABASE_DB_PORT || 5432;
  const dbUser = process.env.SUPABASE_DB_USER || 'postgres';
  const dbName = process.env.SUPABASE_DB_NAME || 'postgres';
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

  const client = new PgClient({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    await client.query(sqlRaw);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(2);
});
