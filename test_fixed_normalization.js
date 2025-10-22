const test_fixed_normalization = async () => {
  console.log("🧪 TESTE DA CORREÇÃO - Normalização de Telefone");
  console.log("=".repeat(50));
  
  // Simular exatamente o que acontece no WhatsApp
  const whatsappPhone = "+5516981459950@s.whatsapp.net"; // Formato WhatsApp real
  
  console.log("📱 Telefone do WhatsApp:", whatsappPhone);
  
  // Nova normalização (apenas números)
  const cleaned = whatsappPhone.replace(/[^0-9]/g, "");
  console.log("🔄 Normalizado (nova função):", cleaned);
  
  // Testar busca com telefone normalizado
  console.log("\n🔍 Testando busca no banco...");
  
  try {
    const response = await fetch(`https://zzugbgoylwbaojdnunuz.supabase.co/rest/v1/user_profiles?phone=eq.${cleaned}&select=id,name,phone`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      }
    });
    
    const result = await response.json();
    console.log("📊 Status:", response.status);
    console.log("📋 Resultado:", result);
    
    if (result.length > 0) {
      console.log("✅ SUCESSO! Usuário encontrado:", result[0].name);
      
      // Agora testar o webhook completo
      await test_webhook_with_correction();
    } else {
      console.log("❌ Usuário ainda não encontrado");
    }
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
};

const test_webhook_with_correction = async () => {
  console.log("\n🧪 TESTE WEBHOOK COMPLETO COM CORREÇÃO");
  console.log("-".repeat(50));
  
  const testPayload = {
    event: "messages.upsert",
    instance: "d8cfea03-bf0f-4ce0-a8aa-2faaec309bfd",
    data: {
      key: {
        remoteJid: "+5516981459950@s.whatsapp.net", // Telefone real do Jeferson
        fromMe: false
      },
      message: {
        conversation: "Oi! Agora vai funcionar?"
      }
    }
  };
  
  try {
    console.log("📤 Enviando para webhook...");
    
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_SECRET
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log("📊 Status:", response.status);
    const result = await response.text();
    console.log("📋 Response:", result);
    
    if (response.ok) {
      console.log("✅ Webhook processou com sucesso!");
      console.log("🎉 AGORA O JEFERSON DEVE RECEBER RESPOSTA DO IA COACH!");
    } else {
      console.log("❌ Webhook falhou");
    }
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
};

test_fixed_normalization();