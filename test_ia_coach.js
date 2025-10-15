// TESTE DIRETO DA IA COACH - Execute no console do navegador

async function testarIACoach() {
  console.log('🧪 Testando IA Coach diretamente...');
  
  try {
    const { data, error } = await supabase.functions.invoke('ia-coach-chat', {
      body: { 
        messageContent: "Oi, como funciona?",
        userProfile: {
          id: "test-user-id",
          full_name: "João Teste",
          age: 30,
          goal_type: "emagrecimento",
          activity_level: "sedentário",
          current_weight: 80,
          target_weight: 70,
          created_at: "2025-10-14T00:00:00Z"
        },
        chatHistory: []
      },
    });

    if (error) {
      console.error('❌ Erro na chamada:', error);
      return;
    }

    console.log('✅ Resposta da IA:', data);
    console.log('💬 Mensagem:', data.reply);
    
    // Testar se o tom está humanizado
    if (data.reply.includes('- ') || data.reply.includes('•')) {
      console.warn('⚠️ IA ainda usando listas - problema no prompt');
    } else {
      console.log('✅ Tom humanizado detectado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Execute esta função no console do navegador:
// testarIACoach();