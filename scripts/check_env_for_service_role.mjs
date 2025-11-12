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
      const val = line.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

function mask(val) {
  if (!val) return 'missing';
  const trimmed = String(val).trim();
  if (!trimmed) return 'missing';
  return `present(len=${trimmed.length})`;
}

loadDotenvLocal();

const report = {
  SUPABASE_URL: mask(process.env.SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
  EVOLUTION_WEBHOOK_SECRET: mask(process.env.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_API_SECRET || process.env.EVOLUTION_API_TOKEN),
};

console.log('ENV CHECK ->', report);
