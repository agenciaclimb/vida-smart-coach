// ============================================
// 🔧 DEBUG JWT IA COACH v8 - VERIFICAÇÃO
// ============================================

console.log('🔧 DEBUG JWT - IA COACH v8');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));

// Teste com diferentes abordagens de autenticação
async function debugJWT() {
  const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNzM0MjIsImV4cCI6MjA0NDg0OTQyMn0.FvaBLFPrxqsYJBqhfhHUJIgzATvj3o50UgfIhMjZlYw';
  
  // 1. Teste básico de conectividade
  console.log('\n1️⃣ TESTE CONECTIVIDADE BÁSICA');
  try {
    const pingResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type'
      }
    });
    console.log('📊 CORS Preflight:', pingResponse.status);
  } catch (error) {
    console.log('❌ Erro conectividade:', error.message);
  }

  // 2. Teste sem autenticação (para ver erro específico)
  console.log('\n2️⃣ TESTE SEM AUTENTICAÇÃO');
  try {
    const noAuthResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageContent: "teste",
        userProfile: { id: 'test', full_name: 'Test' },
        chatHistory: []
      })
    });
    console.log('📊 Status sem auth:', noAuthResponse.status);
    const noAuthText = await noAuthResponse.text();
    console.log('📝 Resposta:', noAuthText);
  } catch (error) {
    console.log('❌ Erro sem auth:', error.message);
  }

  // 3. Teste com ANON_KEY
  console.log('\n3️⃣ TESTE COM ANON_KEY');
  try {
    const authResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      },
      body: JSON.stringify({
        messageContent: "Oi, preciso de ajuda",
        userProfile: { id: 'test-123', full_name: 'João' },
        chatHistory: []
      })
    });
    
    console.log('📊 Status com ANON_KEY:', authResponse.status);
    
    if (authResponse.ok) {
      const data = await authResponse.json();
      console.log('✅ Sucesso! Resposta:', data);
      
      if (data.reply) {
        const questionCount = (data.reply.match(/\?/g) || []).length;
        console.log('💬 Resposta da IA:', data.reply);
        console.log('❓ Número de perguntas:', questionCount);
        console.log('🎯 Otimização v8:', questionCount <= 1 ? '✅ SUCESSO!' : '⚠️ Ainda verbosa');
      }
    } else {
      const errorText = await authResponse.text();
      console.log('❌ Erro com auth:', errorText);
    }
  } catch (error) {
    console.log('❌ Erro request:', error.message);
  }

  // 4. Verificar se é problema de deployment
  console.log('\n4️⃣ INFORMAÇÕES DE DEBUG');
  console.log('🔑 ANON_KEY (primeiros 20 chars):', anonKey.substring(0, 20) + '...');
  console.log('🌐 URL:', `${supabaseUrl}/functions/v1/ia-coach-chat`);
  console.log('📋 Headers usados: Content-Type, Authorization, apikey');
  
  console.log('\n💡 POSSÍVEIS CAUSAS:');
  console.log('1. Deploy não foi aplicado corretamente');
  console.log('2. Função está com erro interno');
  console.log('3. RLS policies bloqueando');
  console.log('4. Chave ANON_KEY expirou ou inválida');
}

debugJWT();