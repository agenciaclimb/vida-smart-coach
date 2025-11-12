// Atualiza o perfil existente e remove duplicados
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

// Atualizar o perfil original
const { data: updated, error: updateErr } = await supabase
  .from('user_profiles')
  .update({ billing_status: 'active', ia_stage: 'seller' })
  .eq('id', '45ba22ad-c44d-4825-a6e9-1658becdb7b4')
  .select();

if (updateErr) {
  console.error('❌ Erro ao atualizar:', updateErr);
} else {
  console.log('✅ Perfil atualizado:', updated);
}

// Remover o duplicado
const { error: deleteErr } = await supabase
  .from('user_profiles')
  .delete()
  .eq('id', '781a3c65-d843-44a5-bcb3-ab1865686f6b');

if (deleteErr) {
  console.error('❌ Erro ao deletar duplicado:', deleteErr);
} else {
  console.log('✅ Duplicado removido');
}

// Deletar auth user duplicado também
const { error: authDelErr } = await supabase.auth.admin.deleteUser('781a3c65-d843-44a5-bcb3-ab1865686f6b');
if (authDelErr) {
  console.log('⚠️ Auth user já foi removido ou não existe:', authDelErr.message);
} else {
  console.log('✅ Auth user duplicado removido');
}
