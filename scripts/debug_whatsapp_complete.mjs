// Debug completo do fluxo webhook → ia-coach
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
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('🔍 DIAGNÓSTICO COMPLETO\n');
  
  // 1. Verificar usuário
  console.log('1️⃣ Verificando usuário no banco...');
  const userRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles?phone=eq.5516981459950&select=id,full_name,phone`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  });
  const users = await userRes.json();
  if (users.length > 0) {
    console.log(`   ✅ Usuário encontrado: ${users[0].full_name} (${users[0].id})`);
  } else {
    console.log('   ❌ Usuário NÃO encontrado com phone=5516981459950');
  }
  
  // 2. Verificar mensagens recentes
  console.log('\n2️⃣ Verificando mensagens WhatsApp...');
  const msgRes = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages?phone=eq.5516981459950&select=phone,message,user_id,timestamp&order=timestamp.desc&limit=3`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  });
  const messages = await msgRes.json();
  if (Array.isArray(messages) && messages.length > 0) {
    console.log(`   ✅ Encontradas ${messages.length} mensagens com phone normalizado`);
    messages.forEach((msg, i) => {
      console.log(`   ${i + 1}. "${msg.message.slice(0, 40)}..." (user_id: ${msg.user_id || 'null'})`);
    });
  } else {
    console.log(`   ⚠️ Nenhuma mensagem encontrada ou erro: ${JSON.stringify(messages).slice(0, 100)}`);
  }
  
  // 3. Testar ia-coach-chat diretamente
  console.log('\n3️⃣ Testando ia-coach-chat direto...');
  if (users.length > 0) {
    const chatHistory = Array.isArray(messages) 
      ? messages.slice(0, 5).reverse().map(m => ({
          role: m.user_id ? 'user' : 'assistant',
          content: m.message,
          created_at: new Date().toISOString(),
        }))
      : [];
    
    console.log(`   Histórico: ${chatHistory.length} mensagens`);
    
    const iaRes = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        messageContent: 'teste de contexto',
        userProfile: {
          id: users[0].id,
          full_name: users[0].full_name,
        },
        chatHistory,
      }),
    });
    
    if (iaRes.ok) {
      const iaData = await iaRes.json();
      console.log(`   ✅ IA respondeu (${iaData.stage}):`);
      console.log(`   "${iaData.reply}"`);
      
      const isPersonalized = iaData.reply.includes('Jeferson') || 
                             iaData.reply.toLowerCase().includes('exercício') ||
                             iaData.reply.toLowerCase().includes('física');
      console.log(`   Personalizada: ${isPersonalized ? '✅ SIM' : '❌ NÃO (genérica)'}`);
    } else {
      const err = await iaRes.text();
      console.log(`   ❌ Erro: ${err}`);
    }
  }
  
  // 4. Checar logs recentes do webhook
  console.log('\n4️⃣ Verificando estrutura da resposta do webhook...');
  console.log('   Para ver logs em tempo real:');
  console.log('   https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/logs/edge-functions');
  console.log('   Procure por: 📞 Phone lookup, 💬 Chat history, 🤖 IA Coach');
}

main().catch(err => {
  console.error('\n💥 Erro:', err);
  process.exit(1);
});
