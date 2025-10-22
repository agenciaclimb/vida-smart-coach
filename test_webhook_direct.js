const test_webhook_direct = async () => {
  console.log("🧪 TESTE DIRETO DO WEBHOOK CORRIGIDO");
  console.log("=====================================");
  
  const testPayload = {
    event: "messages.upsert",
    instance: "d8cfea03-bf0f-4ce0-a8aa-2faaec309bfd",
    data: {
      key: {
        remoteJid: "+5516981459950@s.whatsapp.net", // Telefone real do Jeferson
        fromMe: false
      },
      message: {
        conversation: "Teste final - agora deve encontrar o usuário!"
      }
    }
  };
  
  try {
    console.log("📤 Enviando para webhook corrigido...");
    console.log("📱 Telefone:", testPayload.data.key.remoteJid);
    console.log("💬 Mensagem:", testPayload.data.message.conversation);
    
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_SECRET
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log("\n📊 Status:", response.status);
    const result = await response.text();
    console.log("📋 Response:", result);
    
    if (response.ok) {
      console.log("\n✅ WEBHOOK PROCESSOU COM SUCESSO!");
      console.log("🎯 Se a normalização está correta, o Jeferson agora deve receber:");
      console.log("   → Resposta personalizada do IA Coach");
      console.log("   → NÃO mais a mensagem genérica de 'cadastre-se'");
    } else {
      console.log("\n❌ Webhook falhou");
    }
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("🔧 CORREÇÃO APLICADA:");
  console.log("• Telefone WhatsApp: +5516981459950@s.whatsapp.net");
  console.log("• Normalização ANTIGA: +5516981459950 (❌ não encontrava)");
  console.log("• Normalização NOVA: 5516981459950 (✅ deve encontrar)");
  console.log("• Usuário no banco: Jeferson Costa (5516981459950)");
  console.log("• Expectativa: IA Coach responder em vez de mensagem genérica");
};

test_webhook_direct();