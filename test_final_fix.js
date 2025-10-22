const test_ia_coach_with_service_key = async () => {
  console.log("🧠 TESTE: IA Coach com SERVICE_ROLE_KEY");
  console.log("=".repeat(45));
  
  const userProfile = {
    id: "45ba22ad-c44d-4825-a6e9-1658becdb7b4",
    name: "Usuário WhatsApp"
  };
  
  const messageContent = "Você é uma IA ou um robô?";
  
  try {
    console.log("🔑 Usando SERVICE_ROLE_KEY...");
    
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/ia-coach-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        messageContent: messageContent,
        userProfile: userProfile,
        chatHistory: []
      })
    });
    
    console.log("📊 Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ IA Coach funcionou!");
      console.log("💬 Resposta:", data.reply || data.response || data.text);
      console.log("🎭 Estágio:", data.stage);
      
      // Verificar se é resposta inteligente
      const responseText = data.reply || data.response || data.text || "";
      const isIntelligent = !responseText.includes("cadastre-se") && 
                           !responseText.includes("aplicativo") &&
                           responseText.length > 50;
      
      console.log(`🧠 Resposta inteligente: ${isIntelligent ? '✅ SIM' : '❌ NÃO'}`);
      
    } else {
      const error = await response.text();
      console.log("❌ IA Coach falhou:", error);
    }
    
  } catch (error) {
    console.log("💥 Erro:", error.message);
  }
  
  // Agora testar o webhook completo
  console.log("\n" + "-".repeat(45));
  await test_webhook_complete();
};

const test_webhook_complete = async () => {
  console.log("🔗 TESTE: Webhook completo");
  
  const payload = {
    event: "messages.upsert",
    instance: "d8cfea03-bf0f-4ce0-a8aa-2faaec309bfd",
    data: {
      key: {
        remoteJid: "+5516981459950@s.whatsapp.net",
        fromMe: false
      },
      message: {
        conversation: "Agora você vai me responder como IA Coach inteligente?"
      }
    }
  };
  
  try {
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_SECRET
      },
      body: JSON.stringify(payload)
    });
    
    console.log("📊 Webhook Status:", response.status);
    const result = await response.text();
    console.log("📋 Webhook Response:", result);
    
    if (response.ok) {
      console.log("✅ Webhook processou!");
      console.log("🎯 Agora o Jeferson deve receber resposta INTELIGENTE do IA Coach!");
    }
    
  } catch (error) {
    console.log("💥 Erro webhook:", error.message);
  }
};

test_ia_coach_with_service_key();