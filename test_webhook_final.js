const test_webhook_fixed = async () => {
  console.log("🧪 Testando Webhook Corrigido...");
  
  // Simular mensagem de usuário cadastrado
  const testPayload = {
    event: "messages.upsert",
    instance: "d8cfea03-bf0f-4ce0-a8aa-2faaec309bfd", // Instance ID real
    data: {
      key: {
        remoteJid: "+5511999999999@s.whatsapp.net", // Formato WhatsApp
        fromMe: false
      },
      message: {
        conversation: "Oi, preciso de um treino personalizado!"
      }
    }
  };
  
  try {
    console.log("📤 Testando webhook com payload corrigido...");
    
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'C26C953E32F6-4223-A0FF-7552BBE45822'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log("📋 Status:", response.status);
    const result = await response.text();
    console.log("📋 Response:", result);
    
    if (response.ok) {
      console.log("✅ Webhook processou com sucesso!");
    } else {
      console.log("❌ Webhook falhou:", response.status);
    }
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
};

// Testar IA Coach com parâmetros corretos
const test_ia_coach_fixed = async () => {
  console.log("\n🧪 Testando IA Coach com parâmetros corretos...");
  
  try {
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/ia-coach-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer process.env.VITE_SUPABASE_ANON_KEY'
      },
      body: JSON.stringify({
        messageContent: "Oi, preciso de um treino personalizado!",
        userProfile: { id: "test-user-whatsapp", name: "Usuário WhatsApp" },
        chatHistory: []
      })
    });
    
    console.log("📋 IA Coach Status:", response.status);
    const result = await response.text();
    console.log("📋 IA Coach Response:", result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log("✅ IA Coach funcionando!");
      console.log("💬 Resposta:", data.response || data.text);
    } else {
      console.log("❌ IA Coach falhou:", response.status);
    }
    
  } catch (error) {
    console.error("💥 Erro IA Coach:", error);
  }
};

// Executar testes
const runTests = async () => {
  await test_ia_coach_fixed();
  console.log("\n" + "=".repeat(50) + "\n");
  await test_webhook_fixed();
};

runTests();