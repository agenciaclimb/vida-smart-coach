const test_ia_coach_direct = async () => {
  console.log("🧪 Testando IA Coach diretamente...");
  
  try {
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/ia-coach-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE'
      },
      body: JSON.stringify({
        message: "Olá, preciso de ajuda!",
        user_id: "test-user-whatsapp",
        channel: "whatsapp"
      })
    });
    
    console.log("📋 IA Coach Status:", response.status);
    const result = await response.text();
    console.log("📋 IA Coach Response:", result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log("✅ IA Coach funcionando!");
      console.log("💬 Resposta:", data.response);
    } else {
      console.log("❌ IA Coach falhou:", response.status);
    }
    
  } catch (error) {
    console.error("💥 Erro IA Coach:", error);
  }
};

const test_evolution_api_send = async () => {
  console.log("🧪 Testando envio Evolution API...");
  
  const testMessage = {
    phone: "+5511999999999",
    instanceId: "test-instance", 
    message: "Teste de resposta automática!"
  };
  
  try {
    const response = await fetch('https://api.evoapicloud.com/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'bad6ff73-1582-4464-b231-5f6752f3a6fb'
      },
      body: JSON.stringify(testMessage)
    });
    
    console.log("📋 Evolution Send Status:", response.status);
    const result = await response.text();
    console.log("📋 Evolution Send Response:", result);
    
  } catch (error) {
    console.error("💥 Erro Evolution Send:", error);
  }
};

const test_user_lookup = async () => {
  console.log("🧪 Testando busca de usuário...");
  
  // Simular busca de usuário por telefone
  try {
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/rest/v1/user_profiles?phone=eq.%2B5511999999999', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE'
      }
    });
    
    console.log("📋 User Lookup Status:", response.status);
    const result = await response.text();
    console.log("📋 User Lookup Response:", result);
    
  } catch (error) {
    console.error("💥 Erro User Lookup:", error);
  }
};

// Executar todos os testes
const runAllTests = async () => {
  await test_ia_coach_direct();
  console.log("\n" + "=".repeat(50) + "\n");
  await test_evolution_api_send();
  console.log("\n" + "=".repeat(50) + "\n");
  await test_user_lookup();
};

runAllTests();