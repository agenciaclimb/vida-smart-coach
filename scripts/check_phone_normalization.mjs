// Check if user phone normalization is working
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

function normalizePhoneNumber(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9]/g, "");
  return cleaned.length ? cleaned : null;
}

async function main() {
  loadDotenvLocal();
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const testPhones = [
    '5516981459950@s.whatsapp.net', // WhatsApp format
    '5516981459950',                 // Normalized
    '+55 16 98145-9950',            // Formatted
  ];

  console.log('🔍 Testing phone number matching...\n');

  for (const phone of testPhones) {
    const normalized = normalizePhoneNumber(phone);
    console.log(`Input: "${phone}"`);
    console.log(`  Normalized: "${normalized}"`);
    
    // Try to find user
    const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?phone=eq.${normalized}&select=id,full_name,phone`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });
    
    const users = await res.json();
    console.log(`  Found: ${users.length > 0 ? '✅ ' + users[0].full_name : '❌ No match'}`);
    if (users.length > 0) {
      console.log(`  DB phone: "${users[0].phone}"`);
    }
    console.log('');
  }

  // Check whatsapp_messages table
  console.log('\n📱 Recent WhatsApp messages:');
  const msgRes = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages?select=phone,message,event,timestamp&order=timestamp.desc&limit=5`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  });
  
  const messages = await msgRes.json();
  if (Array.isArray(messages) && messages.length > 0) {
    messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. Phone: ${msg.phone}`);
      console.log(`     Message: "${msg.message.slice(0, 50)}..."`);
      console.log(`     Event: ${msg.event}`);
      console.log('');
    });
  } else {
    console.log('  No messages found or table error:', messages);
  }
}

main().catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
