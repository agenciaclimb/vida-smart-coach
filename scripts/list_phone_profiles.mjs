// Lista todos os profiles com esse telefone
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function loadDotenvLocal() {
  const candidates = ['.env.local', '.env.development.local', '.env'];
  for (const fname of candidates) {
    const envPath = path.resolve(process.cwd(), fname);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      val = val.replace(/\$\{([^}]+)\}/g, (_, varName) => process.env[varName] || '');
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

loadDotenvLocal();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase
  .from('user_profiles')
  .select('id, full_name, phone, billing_status, ia_stage')
  .eq('phone', '5516981459950');

if (error) {
  console.error('❌ Erro:', error);
} else {
  console.log('✅ Profiles encontrados:', data);
  console.log('Total:', data.length);
}
