const debug_deep_investigation = async () => {
  console.log("🔍 INVESTIGAÇÃO PROFUNDA - Por que ainda não funciona?");
  console.log("=".repeat(60));
  
  // 1. Verificar EXATAMENTE como o telefone está salvo no banco
  console.log("1️⃣ VERIFICAÇÃO DO BANCO DE DADOS:");
  
  try {
    // Buscar todos os usuários para ver o formato exato
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/rest/v1/user_profiles?select=id,name,phone', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    if (response.ok) {
      const users = await response.json();
      console.log("📊 Usuários no banco:");
      users.forEach(user => {
        console.log(`   • ${user.name}: "${user.phone}" (ID: ${user.id})`);
        console.log(`     Tipo: ${typeof user.phone}, Comprimento: ${user.phone?.length}`);
      });
      
      // Encontrar o Jeferson especificamente
      const jeferson = users.find(u => u.name?.includes('Jeferson'));
      if (jeferson) {
        console.log(`\n🎯 JEFERSON ENCONTRADO:`);
        console.log(`   Nome: "${jeferson.name}"`);
        console.log(`   Telefone: "${jeferson.phone}"`);
        console.log(`   ID: ${jeferson.id}`);
        
        // Testar várias normalizações contra o telefone do Jeferson
        await testNormalizations(jeferson.phone);
      }
    } else {
      const error = await response.text();
      console.log("❌ Erro ao buscar usuários:", error);
    }
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
};

const testNormalizations = async (realPhone) => {
  console.log("\n2️⃣ TESTE DE NORMALIZAÇÕES:");
  console.log(`📱 Telefone real no banco: "${realPhone}"`);
  
  // Simular diferentes formatos que o WhatsApp pode enviar
  const whatsappFormats = [
    "+5516981459950@s.whatsapp.net",
    "5516981459950@s.whatsapp.net", 
    "+55 16 98145-9950@s.whatsapp.net",
    "55 16 98145-9950@s.whatsapp.net",
    "+55 (16) 98145-9950@s.whatsapp.net"
  ];
  
  whatsappFormats.forEach(format => {
    // Normalização atual
    const cleaned = format.replace(/[^0-9]/g, "");
    const match = cleaned === realPhone;
    console.log(`📱 "${format}"`);
    console.log(`   → Normalizado: "${cleaned}"`);
    console.log(`   → Match com banco: ${match ? '✅' : '❌'}`);
  });
  
  // 3. Testar a função findUserByPhone simulada
  console.log("\n3️⃣ TESTE FUNÇÃO FINDUSER:");
  await testFindUserFunction(realPhone);
};

const testFindUserFunction = async (targetPhone) => {
  console.log(`🔍 Simulando busca por: "${targetPhone}"`);
  
  try {
    const response = await fetch(`https://zzugbgoylwbaojdnunuz.supabase.co/rest/v1/user_profiles?phone=eq.${encodeURIComponent(targetPhone)}&select=id,phone`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    const result = await response.json();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Resultado:`, result);
    
    if (Array.isArray(result) && result.length > 0) {
      console.log("✅ USUÁRIO ENCONTRADO!");
      return result[0];
    } else {
      console.log("❌ USUÁRIO NÃO ENCONTRADO!");
      return null;
    }
    
  } catch (error) {
    console.log("💥 Erro na busca:", error);
    return null;
  }
};

// 4. Testar com dados reais do WhatsApp
const testWithRealWhatsAppData = async () => {
  console.log("\n4️⃣ TESTE COM DADOS REAIS WHATSAPP:");
  
  // Dados exatos como chegam do WhatsApp
  const whatsappData = {
    key: {
      remoteJid: "+5516981459950@s.whatsapp.net" // Formato que chega do WhatsApp
    },
    message: {
      conversation: "Teste de mensagem"
    }
  };
  
  console.log("📱 remoteJid original:", whatsappData.key.remoteJid);
  
  // Simular a normalização do webhook
  const normalized = whatsappData.key.remoteJid.replace(/[^0-9]/g, "");
  console.log("🔄 Após normalização:", normalized);
  
  // Testar se encontra usuário
  const user = await testFindUserFunction(normalized);
  
  if (user) {
    console.log("✅ SUCESSO: Usuário seria encontrado!");
    console.log("🎯 IA Coach seria chamado!");
  } else {
    console.log("❌ FALHA: Usuário NÃO seria encontrado!");
    console.log("🤖 Resposta genérica seria enviada!");
  }
};

// Executar investigação completa
const runInvestigation = async () => {
  await debug_deep_investigation();
  await testWithRealWhatsAppData();
  
  console.log("\n" + "=".repeat(60));
  console.log("🎯 CONCLUSÃO DA INVESTIGAÇÃO:");
  console.log("   Se o usuário não foi encontrado, o problema está na:");
  console.log("   1. Normalização do telefone OU");
  console.log("   2. Formato do telefone salvo no banco OU"); 
  console.log("   3. Query de busca no Supabase");
};

runInvestigation();