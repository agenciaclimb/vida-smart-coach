import fs from 'node:fs';
import path from 'node:path';

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

function parseArgs() {
  const out = { userId: '', name: '', text: 'oi' };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
    out[key] = val;
  }
  return out;
}

async function main() {
  loadDotenvLocal();
  const { userId, name, text } = parseArgs();
  const url = `${process.env.SUPABASE_URL}/functions/v1/ia-coach-chat`;
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !token || !userId) {
    console.error('Missing SUPABASE_URL/token or --userId');
    process.exit(1);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Internal-Secret': process.env.INTERNAL_FUNCTION_SECRET || ''
    },
    body: JSON.stringify({
      messageContent: text,
      userProfile: { id: userId, full_name: name || 'Teste' },
      chatHistory: []
    })
  });
  const textBody = await res.text();
  try {
    const json = JSON.parse(textBody);
    console.log('status', res.status);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('status', res.status, 'raw:', textBody);
  }
}

main();
