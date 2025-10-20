// Teste final da correção JWT no WhatsApp IA Coach
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testWhatsAppIACoachFixed() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🧪 TESTE FINAL: Correção JWT WhatsApp IA Coach\n');
    
    console.log('📍 SUPABASE_URL:', supabaseUrl);
    console.log('🔑 ANON_KEY length:', anonKey ? anonKey.length : 'UNDEFINED');
    console.log();
    
    // Simular chamada exata que o webhook faz para o IA Coach
    console.log('📤 Testando chamada IA Coach com ANON_KEY (correção aplicada)...');
    
    try {
        const iaCoachResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
                messageContent: "Olá, estou testando a integração WhatsApp",
                userProfile: { id: "test-whatsapp", name: "Usuário WhatsApp" },
                chatHistory: []
            }),
        });
        
        console.log('📊 IA Coach Status:', iaCoachResponse.status, iaCoachResponse.statusText);
        
        if (iaCoachResponse.ok) {
            const iaCoachData = await iaCoachResponse.json();
            console.log('✅ IA Coach Response:', {
                reply: iaCoachData.reply ? iaCoachData.reply.substring(0, 100) + '...' : 'N/A',
                stage: iaCoachData.stage,
                model: iaCoachData.model,
                timestamp: iaCoachData.timestamp
            });
            
            console.log('\n🎉 RESULTADO: CORREÇÃO JWT FUNCIONANDO! IA Coach responde corretamente.');
            
        } else {
            const errorText = await iaCoachResponse.text();
            console.log('❌ IA Coach Error:', errorText);
            console.log('\n🚨 RESULTADO: CORREÇÃO JWT FALHOU! Ainda há problemas de autenticação.');
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
        console.log('\n🚨 RESULTADO: ERRO DE CONECTIVIDADE! Problema na requisição.');
    }
    
    // Teste adicional: Verificar se webhook está respondendo
    console.log('\n📤 Testando webhook evolution-webhook...');
    
    try {
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": process.env.EVOLUTION_API_SECRET,
            },
            body: JSON.stringify({
                event: "messages.upsert",
                instance: "test-instance", 
                data: {
                    key: {
                        remoteJid: "5516981459950@s.whatsapp.net",
                        fromMe: false
                    },
                    message: {
                        conversation: "Teste da correção JWT"
                    }
                }
            }),
        });
        
        console.log('📊 Webhook Status:', webhookResponse.status, webhookResponse.statusText);
        
        if (webhookResponse.ok) {
            const webhookData = await webhookResponse.json();
            console.log('✅ Webhook Response:', webhookData);
            console.log('\n🎉 RESULTADO: WEBHOOK FUNCIONANDO! Integração WhatsApp operacional.');
        } else {
            const errorText = await webhookResponse.text();
            console.log('❌ Webhook Error:', errorText);
            console.log('\n🚨 RESULTADO: WEBHOOK COM PROBLEMAS! Revisar configuração.');
        }
        
    } catch (error) {
        console.error('❌ Erro no webhook:', error.message);
        console.log('\n🚨 RESULTADO: ERRO NO WEBHOOK! Problema na requisição.');
    }
}

testWhatsAppIACoachFixed();