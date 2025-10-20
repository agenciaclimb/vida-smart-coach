// Script de debug para IA Coach Strategic System

async function debugIACoachSystem() {
  const baseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/ia-coach-chat';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer process.env.VITE_SUPABASE_ANON_KEY'
  };

  const testUser = {
    id: 'test-user-123',
    full_name: 'João Silva',
    email: 'joao@teste.com'
  };

  console.log('🔍 Debugando Sistema IA Coach...\n');

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageContent: "Oi, preciso de ajuda com minha saúde",
        userProfile: testUser,
        chatHistory: []
      })
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Status text:', response.statusText);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📝 Resposta bruta:', responseText);

    if (response.status !== 200) {
      console.error('❌ Erro na Edge Function');
      console.log('💡 Possíveis causas:');
      console.log('   1. Migração não aplicada no Supabase');
      console.log('   2. Problemas na Edge Function');
      console.log('   3. Variáveis de ambiente incorretas');
    } else {
      const result = JSON.parse(responseText);
      console.log('✅ Resposta processada:', result);
    }

  } catch (error) {
    console.error('❌ Erro de rede:', error.message);
    console.log('💡 Verificar:');
    console.log('   1. URL da Edge Function');
    console.log('   2. Token de autorização');
    console.log('   3. Conectividade com internet');
  }
}

// Executar debug
debugIACoachSystem();