const debug_ia_coach_call = async () => {
  console.log("🧠 DEBUG: Verificando chamada do IA Coach");
  console.log("=".repeat(50));
  
  // Simular exatamente a chamada que o webhook faz
  const userProfile = {
    id: "45ba22ad-c44d-4825-a6e9-1658becdb7b4",
    name: "Usuário WhatsApp"
  };
  
  const messageContent = "Quero saber como usar o sistema da melhor maneira";
  
  console.log("📤 Dados enviados para IA Coach:");
  console.log("   messageContent:", messageContent);
  console.log("   userProfile:", userProfile);
  console.log("   chatHistory: []");
  
  try {
    console.log("\n🔄 Chamando IA Coach...");
    
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/ia-coach-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ285bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE'
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
      console.log("✅ IA Coach respondeu:");
      console.log("📋 Resposta completa:", JSON.stringify(data, null, 2));
      console.log("💬 Texto da resposta:", data.reply || data.response || data.text);
      console.log("🎭 Estágio:", data.stage);
      
      // Verificar se a resposta é inteligente
      const response_text = data.reply || data.response || data.text || "";
      if (response_text.includes("cadastre-se") || response_text.includes("aplicativo")) {
        console.log("❌ PROBLEMA: IA Coach está retornando resposta genérica!");
      } else {
        console.log("✅ IA Coach está funcionando com resposta inteligente!");
      }
      
    } else {
      const errorText = await response.text();
      console.log("❌ IA Coach falhou:");
      console.log("📋 Erro:", errorText);
    }
    
  } catch (error) {
    console.log("💥 Erro na chamada:", error.message);
  }
  
  // Agora vamos verificar se há logs do webhook
  console.log("\n" + "=".repeat(50));
  console.log("🔍 PRÓXIMO PASSO: Verificar logs do webhook no Supabase");
  console.log("📋 Dashboard: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/functions");
  console.log("🎯 Procurar por logs da função evolution-webhook");
  console.log("📝 Verificar se o matchedUser está sendo encontrado");
};

debug_ia_coach_call();