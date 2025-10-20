const test_evolution_webhook = async () => {
  console.log("🧪 Testando Evolution Webhook...");
  
  // Simular uma mensagem do WhatsApp
  const testPayload = {
    event: "messages.upsert",
    instance: "test-instance",
    data: {
      key: {
        remoteJid: "+5511999999999",
        fromMe: false
      },
      message: {
        conversation: "Olá, preciso de ajuda!"
      }
    }
  };
  
  try {
    console.log("📤 Enviando payload:", JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'C26C953E32F6-4223-A0FF-7552BBE45822' // EVOLUTION_API_SECRET
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log("📋 Status:", response.status);
    console.log("📋 Headers:", Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log("📋 Response:", result);
    
    if (response.ok) {
      console.log("✅ Webhook respondeu com sucesso!");
    } else {
      console.log("❌ Webhook falhou:", response.status);
    }
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
};

// Executar o teste
test_evolution_webhook();