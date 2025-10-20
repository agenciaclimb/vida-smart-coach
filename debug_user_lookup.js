const debug_user_lookup = async () => {
  console.log("🔍 DEBUG: Investigando problema de usuário não encontrado");
  console.log("=".repeat(60));
  
  // 1. Verificar exatamente qual telefone está chegando
  console.log("\n1️⃣ TELEFONE DO USUÁRIO REAL:");
  const realUserPhone = "5516981459950";
  const normalizedPhone = `+${realUserPhone}`;
  console.log("📱 Telefone original:", realUserPhone);
  console.log("📱 Telefone normalizado:", normalizedPhone);
  
  // 2. Buscar usuário com diferentes variações
  const variations = [
    realUserPhone,                    // 5516981459950
    `+${realUserPhone}`,             // +5516981459950
    `+55${realUserPhone.slice(2)}`,  // +5516981459950 (mesmo resultado)
    `55${realUserPhone.slice(2)}`,   // 5516981459950 (mesmo resultado)
  ];
  
  console.log("\n2️⃣ TESTANDO VARIAÇÕES DE TELEFONE:");
  
  for (const phone of variations) {
    try {
      const encodedPhone = encodeURIComponent(phone);
      const url = `https://zzugbgoylwbaojdnunuz.supabase.co/rest/v1/user_profiles?phone=eq.${encodedPhone}&select=id,name,phone`;
      
      console.log(`\n🔍 Buscando: "${phone}"`);
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE'
        }
      });
      
      const result = await response.json();
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Resultado:`, result.length > 0 ? result : "❌ Nenhum usuário encontrado");
      
      if (result.length > 0) {
        console.log(`✅ USUÁRIO ENCONTRADO com telefone: "${phone}"`);
      }
      
    } catch (error) {
      console.log(`❌ Erro:`, error.message);
    }
  }
  
  // 3. Verificar como o WhatsApp está enviando o telefone
  console.log("\n3️⃣ FORMATO WHATSAPP:");
  const whatsappFormats = [
    `+${realUserPhone}@s.whatsapp.net`,
    `${realUserPhone}@s.whatsapp.net`,
    `+5516981459950@s.whatsapp.net`
  ];
  
  whatsappFormats.forEach(format => {
    console.log(`📱 WhatsApp format: ${format}`);
    // Simular normalização do webhook
    const normalized = format.replace(/[^0-9+]/g, "");
    const final = normalized.startsWith("+") ? normalized : 
                  normalized.startsWith("55") ? `+${normalized}` : 
                  normalized.length ? `+${normalized}` : null;
    console.log(`🔄 Normalizado: ${final}`);
  });
  
  // 4. Testar função de normalização atual
  console.log("\n4️⃣ TESTE FUNÇÃO NORMALIZAÇÃO:");
  const testPhones = [
    "+5516981459950@s.whatsapp.net",
    "5516981459950@s.whatsapp.net", 
    "+5516981459950",
    "5516981459950"
  ];
  
  testPhones.forEach(phone => {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    const final = cleaned.startsWith("+") ? cleaned : 
                  cleaned.startsWith("55") ? `+${cleaned}` : 
                  cleaned.length ? `+${cleaned}` : null;
    console.log(`📱 "${phone}" → "${final}"`);
  });
};

debug_user_lookup();