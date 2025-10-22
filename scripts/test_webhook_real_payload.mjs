// Simula webhook Evolution API com payload real
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

async function main() {
  loadDotenvLocal();
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const webhookSecret = process.env.EVOLUTION_API_SECRET || process.env.EVOLUTION_WEBHOOK_SECRET;
  
  if (!supabaseUrl || !webhookSecret) {
    console.error('Missing SUPABASE_URL or webhook secret in .env.local');
    process.exit(1);
  }

  // Payload exatamente como Evolution envia
  const payload = {
    event: 'messages.upsert',
    instance: process.env.EVOLUTION_INSTANCE_ID || 'vida-smart-coach-v3',
    data: {
      key: {
        remoteJid: '5516981459950@s.whatsapp.net', // Jeferson's phone
        id: `test-${Date.now()}`,
        fromMe: false,
      },
      message: {
        conversation: 'teste robô',
      },
    },
  };

  console.log('📤 Sending webhook payload...');
  console.log(`   Phone: ${payload.data.key.remoteJid}`);
  console.log(`   Message: "${payload.data.message.conversation}"`);
  
  const res = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': webhookSecret,
    },
    body: JSON.stringify(payload),
  });

  const resText = await res.text();
  let resJson;
  try { resJson = JSON.parse(resText); } catch { resJson = { raw: resText }; }

  console.log(`\n📥 Webhook response (${res.status}):`);
  console.log(JSON.stringify(resJson, null, 2));

  if (res.ok) {
    console.log('\n✅ Webhook processed successfully');
    console.log('📋 Next steps:');
    console.log('   1. Check WhatsApp for the response');
    console.log('   2. Check Supabase logs: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/logs/edge-functions');
    console.log('   3. Look for console.log with 📞 (phone lookup) and 🤖 (IA response)');
  } else {
    console.error('\n❌ Webhook failed');
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
