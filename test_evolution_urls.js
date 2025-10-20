const test_evolution_endpoints = async () => {
  console.log("🧪 Testando endpoints Evolution API...");
  
  const baseUrl = "https://api.evoapicloud.com";
  const apiKey = "bad6ff73-1582-4464-b231-5f6752f3a6fb";
  
  // Testar diferentes endpoints possíveis
  const endpoints = [
    "/message/sendText",
    "/sendMessage", 
    "/send",
    "/webhook/send-message",
    "/api/send-message",
    "/instance/send",
    "/sendText"
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📋 Testando: ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          number: "+5511999999999",
          message: "Teste",
          phone: "+5511999999999", 
          text: "Teste"
        })
      });
      
      console.log(`Status: ${response.status}`);
      const result = await response.text();
      console.log(`Response: ${result.substring(0, 200)}...`);
      
      if (response.status !== 404) {
        console.log(`✅ Endpoint possível encontrado: ${endpoint}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
};

// Também vou testar chamada direta para instância
const test_instance_endpoint = async () => {
  console.log("\n🧪 Testando endpoint por instância...");
  
  const instanceId = "d8cfea03-bf0f-4ce0-a8aa-2faaec309bfd";
  const url = `https://api.evoapicloud.com/message/sendText/${instanceId}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'bad6ff73-1582-4464-b231-5f6752f3a6fb'
      },
      body: JSON.stringify({
        number: "5511999999999",
        text: "Teste de mensagem automática"
      })
    });
    
    console.log(`Status: ${response.status}`);
    const result = await response.text();
    console.log(`Response: ${result}`);
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
};

test_evolution_endpoints().then(() => test_instance_endpoint());