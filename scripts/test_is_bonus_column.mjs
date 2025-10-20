import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// Carrega .env.local se existir; caso contrário, .env padrão
try {
  const localEnv = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else {
    dotenv.config();
  }
} catch {}
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || 'https://zzugbgoylwbaojdnunuz.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida');
  process.exit(2);
}

const supabase = createClient(url, key);

async function run() {
  try {
    const { data, error } = await supabase
      .from('daily_activities')
      .select('is_bonus')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao selecionar is_bonus em daily_activities:', error.message || error);
      process.exit(1);
    }

    console.log('✅ Consulta OK. Coluna is_bonus acessível. Exemplo:', data?.[0] ?? null);
    process.exit(0);
  } catch (e) {
    console.error('💥 Exceção:', e.message);
    process.exit(1);
  }
}

run();
