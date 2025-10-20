// 🔍 DIAGNÓSTICO COMPLETO - WhatsApp não responde após deploy v9
// Vamos verificar todos os pontos críticos

const { createClient } = require('@supabase/supabase-js');

async function diagnosticoCompleto() {
    console.log('🔍 === DIAGNÓSTICO WHATSAPP PÓS-DEPLOY v9 ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('1️⃣ === TESTE WEBHOOK ENDPOINT ===');
    try {
        const webhookTest = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: 'messages.upsert',
                data: {
                    key: {
                        remoteJid: '5516981459950@s.whatsapp.net',
                        id: 'test-123'
                    },
                    message: {
                        conversation: 'Teste diagnóstico v9'
                    }
                }
            })
        });
        
        console.log('✅ Webhook Status:', webhookTest.status);
        
        if (webhookTest.ok) {
            const webhookResponse = await webhookTest.json();
            console.log('📥 Webhook Response:', JSON.stringify(webhookResponse, null, 2));
        } else {
            const errorText = await webhookTest.text();
            console.log('❌ Webhook Error:', errorText);
        }
    } catch (error) {
        console.error('💥 Erro no teste webhook:', error.message);
    }
    
    console.log('\n2️⃣ === TESTE IA COACH v8 ===');
    try {
        const iaTest = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Teste diagnóstico v9',
                phone: '5516981459950',
                history: '',
                channel: 'whatsapp'
            })
        });
        
        console.log('✅ IA Coach Status:', iaTest.status);
        
        if (iaTest.ok) {
            const iaResponse = await iaTest.json();
            console.log('🧠 IA Response:', JSON.stringify(iaResponse, null, 2));
        } else {
            const errorText = await iaTest.text();
            console.log('❌ IA Error:', errorText);
        }
    } catch (error) {
        console.error('💥 Erro no teste IA:', error.message);
    }
    
    console.log('\n3️⃣ === VERIFICAR MENSAGENS WHATSAPP RECENTES ===');
    try {
        const { data: recentMessages, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
        } else {
            console.log('📱 Últimas mensagens WhatsApp:');
            recentMessages.forEach(msg => {
                const date = new Date(msg.timestamp).toLocaleString();
                console.log(`  ${date} | ${msg.phone} | ${msg.event} | ${msg.message.substring(0, 50)}...`);
            });
        }
    } catch (error) {
        console.error('💥 Erro ao verificar mensagens:', error.message);
    }
    
    console.log('\n4️⃣ === VERIFICAR VARIÁVEIS ENVIRONMENT ===');
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY', 
        'EVOLUTION_API_KEY',
        'EVOLUTION_BASE_URL',
        'EVOLUTION_INSTANCE_NAME'
    ];
    
    console.log('🔑 Variáveis necessárias para WhatsApp:');
    requiredVars.forEach(varName => {
        // Simulando verificação - não podemos acessar env do servidor
        console.log(`  ${varName}: [DEVE ESTAR CONFIGURADA]`);
    });
    
    console.log('\n5️⃣ === VERIFICAR LOGS SUPABASE ===');
    console.log('📋 Verifique os logs em:');
    console.log('   Supabase Dashboard > Edge Functions > evolution-webhook > Logs');
    console.log('   Supabase Dashboard > Edge Functions > ia-coach-chat > Logs');
    
    console.log('\n6️⃣ === TESTE EVOLUTION API DIRETO ===');
    console.log('🧪 Para testar Evolution API diretamente:');
    console.log('URL: https://your-evolution-url/message/sendText/your-instance');
    console.log('Headers: { "apikey": "C26C953E32F8-4223-A0FF-755288E45822" }');
    console.log('Body: { "number": "5516981459950", "text": "Teste direto" }');
    
    console.log('\n🎯 === CHECKLIST PASSO-A-PASSO ===');
    console.log('□ 1. Webhook responde (status 200)');
    console.log('□ 2. IA Coach responde (status 200)');
    console.log('□ 3. Mensagens sendo inseridas no banco');
    console.log('□ 4. Evolution API recebendo chamadas');
    console.log('□ 5. Token Evolution API correto');
    console.log('□ 6. URL Evolution API correta');
    console.log('□ 7. Formato JSON correto (text, não message)');
    
    console.log('\n💡 === PRÓXIMOS PASSOS ===');
    console.log('1. Execute este diagnóstico');
    console.log('2. Verifique logs do Supabase');
    console.log('3. Teste Evolution API diretamente');
    console.log('4. Confirme configuração Evolution webhook');
}

diagnosticoCompleto().catch(console.error);