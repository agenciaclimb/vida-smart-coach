const check_real_users = async () => {
  console.log("🔍 Verificando usuários com telefone cadastrado...");
  
  try {
    const response = await fetch('https://zzugbgoylwbaojdnunuz.supabase.co/rest/v1/user_profiles?select=id,name,phone', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE'
      }
    });
    
    console.log("📋 Status:", response.status);
    const users = await response.json();
    
    console.log(`📊 Total de usuários: ${users.length}`);
    
    const usersWithPhone = users.filter(user => user.phone && user.phone.trim() !== '');
    console.log(`📱 Usuários com telefone: ${usersWithPhone.length}`);
    
    if (usersWithPhone.length > 0) {
      console.log("\n📋 Usuários com telefone:");
      usersWithPhone.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.phone} (ID: ${user.id})`);
      });
      
      // Testar com o primeiro usuário real
      if (usersWithPhone[0]) {
        await test_webhook_with_real_user(usersWithPhone[0]);
      }
    } else {
      console.log("❌ Nenhum usuário com telefone cadastrado");
    }
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
};

const test_webhook_with_real_user = async (user) => {
  console.log(`\n🧪 Testando webhook com usuário real: ${user.name} (${user.phone})`);
  
  const testPayload = {
    event: "messages.upsert",
    instance: "d8cfea03-bf0f-4ce0-a8aa-2faaec309bfd",
    data: {
      key: {
        remoteJid: user.phone.includes('@') ? user.phone : `${user.phone}@s.whatsapp.net`,
        fromMe: false
      },
      message: {
        conversation: "Oi! Estou testando o sistema de IA Coach pelo WhatsApp"
      }
    }
  };
  
  try {
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
    
  } catch (error) {
    console.error("💥 Erro:", error);
  }
};

check_real_users();