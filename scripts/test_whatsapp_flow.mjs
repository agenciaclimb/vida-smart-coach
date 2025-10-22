// Test real WhatsApp flow: user lookup by phone + ia-coach-chat call
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
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  // 1. Lookup users with phone numbers
  console.log('1. Looking up users with phone numbers...');
  const usersRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=id,phone,full_name&phone=not.is.null`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  });
  const users = await usersRes.json();
  console.log(`Found ${users.length} users with phone numbers`);
  
  if (users.length === 0) {
    console.log('No users with phone found. Cannot test real flow.');
    return;
  }

  const testUser = users[0];
  console.log(`\n2. Testing with user: ${testUser.full_name} (${testUser.phone})`);

  // 2. Get recent WhatsApp messages for this user
  const messagesRes = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages?phone=eq.${testUser.phone}&order=timestamp.desc&limit=5`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  });
  const messages = await messagesRes.json();
  console.log(`   Recent messages: ${Array.isArray(messages) ? messages.length : 'error'}`);
  if (!Array.isArray(messages)) {
    console.log(`   Messages response:`, messages);
    console.log('   Using empty chat history...');
  }
  if (Array.isArray(messages) && messages.length > 0) {
    console.log(`   Last message: "${messages[0].message.slice(0, 60)}..."`);
  }

  // 3. Call ia-coach-chat with this user
  console.log('\n3. Calling ia-coach-chat...');
  const chatHistory = Array.isArray(messages) 
    ? messages.slice(0, 5).reverse().map(m => ({
        role: m.user_id ? 'user' : 'assistant',
        content: m.message,
        created_at: new Date().toISOString(),
      }))
    : [];
  const iaRes = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      messageContent: 'Teste de fluxo real',
      userProfile: {
        id: testUser.id,
        full_name: testUser.full_name,
      },
      chatHistory: chatHistory,
    }),
  });

  if (!iaRes.ok) {
    const errText = await iaRes.text();
    console.error(`   ❌ IA Coach error ${iaRes.status}:`, errText);
    return;
  }

  const iaData = await iaRes.json();
  console.log(`   ✅ IA Coach response (${iaData.stage}):`);
  console.log(`   "${iaData.reply}"`);
  console.log(`\n4. Summary:`);
  console.log(`   - User lookup: OK`);
  console.log(`   - Message history: ${Array.isArray(messages) ? messages.length : 0} messages`);
  console.log(`   - IA stage: ${iaData.stage}`);
  console.log(`   - Response length: ${iaData.reply.length} chars`);
  
  // Check if response is generic
  const isGeneric = iaData.reply.includes('Sou seu Vida Smart Coach') || 
                    iaData.reply.includes('Como posso ajudá-lo');
  console.log(`   - Generic response: ${isGeneric ? '⚠️ YES (robotized)' : '✅ NO (personalized)'}`);
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
