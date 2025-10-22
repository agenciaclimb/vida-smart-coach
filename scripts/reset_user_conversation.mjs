// Reset user conversation history via Supabase REST API
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
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = '45ba22ad-c44d-4825-a6e9-1658becdb7b4';
  const phone = '5516981459950';
  
  console.log('🧹 Resetando histórico de conversa...\n');
  
  // 1. Delete whatsapp_messages
  console.log('1️⃣ Limpando mensagens WhatsApp...');
  const msg = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages?phone=eq.${phone}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    }
  });
  const msgData = await msg.json().catch(() => []);
  console.log(`   ✅ Removidas ${Array.isArray(msgData) ? msgData.length : 0} mensagens\n`);
  
  // 2. Delete client_stages
  console.log('2️⃣ Limpando estágios do cliente...');
  const stages = await fetch(`${supabaseUrl}/rest/v1/client_stages?user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    }
  });
  const stagesData = await stages.json().catch(() => []);
  console.log(`   ✅ Removidos ${Array.isArray(stagesData) ? stagesData.length : 0} estágios\n`);
  
  // 3. Delete interactions
  console.log('3️⃣ Limpando interações...');
  const interactions = await fetch(`${supabaseUrl}/rest/v1/interactions?user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    }
  });
  const intData = await interactions.json().catch(() => []);
  console.log(`   ✅ Removidas ${Array.isArray(intData) ? intData.length : 0} interações\n`);
  
  console.log('✅ Reset concluído! Usuário agora é como um cliente novo.\n');
  console.log('📱 Pode enviar uma mensagem no WhatsApp para começar do zero.');
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
