// 🔍 DIAGNÓSTICO ESPECÍFICO WHATSAPP
// Foco no problema da IA não responder no WhatsApp

import { createClient } from '@supabase/supabase-js';

async function diagnosticoWhatsApp() {
    console.log('🔍 === DIAGNÓSTICO ESPECÍFICO WHATSAPP ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxMjcyNDksImV4cCI6MjA0NzcwMzI0OX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';
    
    console.log('1️⃣ === VERIFICAR MENSAGENS WHATSAPP HOJE ===');
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Buscar mensagens das últimas 2 horas
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        
        const { data: recentMessages, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .gte('timestamp', twoHoursAgo)
            .order('timestamp', { ascending: false });
            
        if (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
        } else {
            console.log(`📱 Mensagens WhatsApp das últimas 2 horas: ${recentMessages.length}`);
            
            recentMessages.forEach((msg, index) => {
                const date = new Date(msg.timestamp).toLocaleString();
                const tipo = msg.event === 'messages.upsert' ? '👤 USER' : '🤖 BOT';
                console.log(`${index + 1}. ${tipo} | ${date} | "${msg.message}"`);
            });
            
            // Análise
            const userMsgs = recentMessages.filter(m => m.event === 'messages.upsert');
            const botMsgs = recentMessages.filter(m => m.event === 'ia_response');
            
            console.log(`\n📊 ANÁLISE ÚLTIMAS 2 HORAS:`);
            console.log(`   👤 Mensagens recebidas: ${userMsgs.length}`);
            console.log(`   🤖 Respostas enviadas: ${botMsgs.length}`);
            
            if (userMsgs.length > 0 && botMsgs.length === 0) {
                console.log('   🚨 PROBLEMA CRÍTICO: Usuário enviou mensagens mas bot não respondeu!');
            } else if (userMsgs.length > botMsgs.length) {
                console.log('   ⚠️ PROBLEMA: Mais mensagens recebidas que enviadas');
            } else if (userMsgs.length === botMsgs.length) {
                console.log('   ✅ APARENTEMENTE OK: Número equilibrado de mensagens');
            }
        }
    } catch (error) {
        console.error('💥 Erro ao verificar mensagens:', error.message);
    }
    
    console.log('\n2️⃣ === TESTE WEBHOOK EVOLUTION REAL ===');
    try {
        const testMessage = `Teste diagnóstico ${new Date().toLocaleTimeString()}`;
        
        const webhookPayload = {
            event: 'messages.upsert',
            data: {
                key: {
                    remoteJid: '5516981459950@s.whatsapp.net',
                    id: 'test-' + Date.now(),
                    fromMe: false
                },
                message: {
                    conversation: testMessage
                }
            }
        };
        
        console.log(`🧪 Enviando mensagem teste: "${testMessage}"`);
        
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify(webhookPayload)
        });
        
        console.log('📥 Webhook Status:', webhookResponse.status);
        console.log('📥 Webhook Status Text:', webhookResponse.statusText);
        
        if (webhookResponse.ok) {
            const result = await webhookResponse.json();
            console.log('✅ Webhook Result:', JSON.stringify(result, null, 2));
            
            if (result.status === 'success') {
                console.log('✅ WEBHOOK FUNCIONOU! Resposta deve ter sido enviada');
            } else if (result.status === 'success_with_fallback') {
                console.log('⚠️ WEBHOOK USOU FALLBACK! IA Coach falhou');
            } else {
                console.log('❌ WEBHOOK RETORNOU STATUS INESPERADO');
            }
        } else {
            const errorText = await webhookResponse.text();
            console.log('❌ Webhook Failed:', errorText);
        }
    } catch (error) {
        console.error('💥 Erro no teste webhook:', error.message);
    }
    
    console.log('\n3️⃣ === TESTE IA COACH DIRETO ===');
    try {
        const iaPayload = {
            message: 'Preciso de ajuda com alimentação',
            phone: '5516981459950',
            history: '',
            channel: 'whatsapp'
        };
        
        console.log('🧠 Testando IA Coach...');
        
        const iaResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify(iaPayload)
        });
        
        console.log('🧠 IA Status:', iaResponse.status);
        
        if (iaResponse.ok) {
            const iaResult = await iaResponse.json();
            console.log('✅ IA Response:', JSON.stringify(iaResult, null, 2));
            
            const reply = iaResult.reply || iaResult.response || iaResult.message;
            if (reply) {
                console.log(`📝 Resposta da IA: "${reply}"`);
            } else {
                console.log('❌ IA NÃO RETORNOU RESPOSTA VÁLIDA');
            }
        } else {
            const errorText = await iaResponse.text();
            console.log('❌ IA Error:', errorText);
        }
    } catch (error) {
        console.error('💥 Erro no teste IA:', error.message);
    }
    
    console.log('\n4️⃣ === VERIFICAÇÕES CRÍTICAS ===');
    console.log('🔍 Verifique no Supabase Dashboard:');
    console.log('   1. Edge Functions → evolution-webhook → Logs');
    console.log('   2. Edge Functions → evolution-webhook → Settings');
    console.log('   3. Variáveis de ambiente configuradas:');
    console.log('      - SUPABASE_SERVICE_ROLE_KEY');
    console.log('      - EVOLUTION_API_KEY');
    console.log('      - EVOLUTION_BASE_URL');
    console.log('      - EVOLUTION_INSTANCE_NAME');
    
    console.log('\n🚨 === POSSÍVEIS CAUSAS ===');
    console.log('CAUSA 1: Webhook não está sendo deployado corretamente');
    console.log('CAUSA 2: SERVICE_ROLE_KEY não configurada');
    console.log('CAUSA 3: Evolution API credentials incorretas');
    console.log('CAUSA 4: Evolution webhook URL incorreta');
    console.log('CAUSA 5: Webhook está funcionando mas Evolution não envia');
    
    console.log('\n💡 === TESTE MANUAL ===');
    console.log('Para testar manualmente:');
    console.log('1. Acesse Supabase Dashboard');
    console.log('2. Edge Functions → evolution-webhook');
    console.log('3. Clique em "Invoke Function"');
    console.log('4. Cole este payload:');
    console.log(JSON.stringify({
        event: 'messages.upsert',
        data: {
            key: {
                remoteJid: '5516981459950@s.whatsapp.net',
                id: 'manual-test'
            },
            message: {
                conversation: 'Teste manual do dashboard'
            }
        }
    }, null, 2));
}

diagnosticoWhatsApp().catch(console.error);