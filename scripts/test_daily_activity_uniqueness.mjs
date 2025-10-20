import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client as PgClient } from 'pg';

try {
  const localEnv = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else {
    dotenv.config();
  }
} catch {
  // ignore dotenv failure
}

async function run() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    console.error('⚠️ SUPABASE_DB_PASSWORD não definida. Configure o acesso ao banco para executar este teste.');
    process.exit(2);
  }

  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const defaultHost = projectRef ? `db.${projectRef}.supabase.co` : null;
  const dbHost = process.env.SUPABASE_DB_HOST || defaultHost;
  if (!dbHost) {
    console.error('⚠️ Host do banco não identificado. Defina SUPABASE_PROJECT_REF ou SUPABASE_DB_HOST.');
    process.exit(2);
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
    const { rows } = await client.query(
      `SELECT indexname
         FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'daily_activities'
          AND indexname = 'uniq_daily_activity_key_per_day'
        LIMIT 1;`
    );

    if (!rows || rows.length === 0) {
      console.error('❌ Índice uniq_daily_activity_key_per_day não encontrado. Execute a migração correspondente.');
      process.exit(1);
    }

    console.log('✅ Índice uniq_daily_activity_key_per_day presente em public.daily_activities.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message || error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
