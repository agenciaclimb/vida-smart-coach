// 🔍 TESTE ESPECÍFICO - BASEADO NO SUPORTE EVOLUTION API
// Verificar se correções do suporte resolveram o problema

import { createClient } from '@supabase/supabase-js';

async function testeEvolutionSuport() {
    console.log('🔍 === TESTE BASEADO NO SUPORTE EVOLUTION ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';
    
    console.log('1️⃣ === INFORMAÇÕES DO SUPORTE EVOLUTION ===');
    console.log('✅ Header correto: "apikey" (confirmado)');
    console.log('✅ Body format: { "text": "mensagem", "number": "DDI+DDD+NUMERO" }');
    console.log('✅ Endpoint: /message/sendText/{INSTANCE_ID}');
    console.log('✅ Number format: 5516981459950 (sem @ e .net)');
    
    console.log('\n2️⃣ === TESTE EVOLUTION API DIRETO ===');
    try {
        // Simular exatamente o que o webhook faria
        const evolutionApiKey = 'bad6ff73-1582-4464-b231-5f6752f3a6fb';
        const evolutionApiUrl = 'https://api.evoapicloud.com';
        const evolutionInstanceId = 'd8cfea03-bf0f-4ce0-a8aa-2faaec309bfd';
        
        const sendUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstanceId}`;
        const cleanNumber = '5516981459950'; // Formato exato conforme suporte
        const testMessage = `Teste suporte Evolution ${new Date().toLocaleTimeString()}`;
        
        const payload = {
            number: cleanNumber,
            text: testMessage
        };
        
        console.log('🧪 Testando Evolution API diretamente...');
        console.log('🌐 URL:', sendUrl);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
        console.log('🔑 API Key:', evolutionApiKey.substring(0, 8) + '...');
        
        const response = await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey
            },
            body: JSON.stringify(payload)
        });
        
        console.log('\n📥 Evolution Response:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ EVOLUTION API FUNCIONOU!');
            console.log('📝 Response:', JSON.stringify(result, null, 2));
        } else {
            const errorText = await response.text();
            console.log('❌ Evolution API Error:', errorText);
            
            if (errorText.includes('JSON')) {
                console.log('🔍 Ainda problema de JSON format');
            } else if (errorText.includes('401') || errorText.includes('403')) {
                console.log('🔍 Problema de autenticação');
            } else if (errorText.includes('404')) {
                console.log('🔍 Endpoint incorreto');
            }
        }
    } catch (error) {
        console.error('💥 Erro Evolution direto:', error.message);
    }
    
    console.log('\n3️⃣ === TESTE WEBHOOK COM CORREÇÕES ===');
    try {
        const testTime = new Date().toLocaleTimeString();
        const testMessage = `Teste webhook Evolution suporte ${testTime}`;
        
        const webhookPayload = {
            event: 'messages.upsert',
            data: {
                key: {
                    remoteJid: '5516981459950@s.whatsapp.net',
                    id: 'test-evolution-support-' + Date.now(),
                    fromMe: false
                },
                message: {
                    conversation: testMessage
                }
            }
        };
        
        console.log(`🧪 Testando webhook: "${testMessage}"`);
        
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify(webhookPayload)
        });
        
        console.log('\n📥 Webhook Response:');
        console.log('Status:', webhookResponse.status);
        
        if (webhookResponse.ok) {
            const result = await webhookResponse.json();
            console.log('✅ Webhook Response:', JSON.stringify(result, null, 2));
            
            if (result.status === 'success') {
                console.log('🎉 SUCESSO TOTAL! IA Coach funcionou');
            } else if (result.status === 'success_with_fallback') {
                console.log('⚠️ Webhook OK, mas IA Coach ainda com problema');
            }
        } else {
            const errorText = await webhookResponse.text();
            console.log('❌ Webhook Error:', errorText);
        }
    } catch (error) {
        console.error('💥 Erro webhook:', error.message);
    }
    
    console.log('\n4️⃣ === VERIFICAR MENSAGENS NO BANCO ===');
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data: mensagens, error } = await supabase
            .from('whatsapp_messages')
            .select('message_content, received_at')
            .order('received_at', { ascending: false })
            .limit(3);
            
        if (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
        } else {
            console.log('📱 Últimas 3 mensagens:');
            mensagens.forEach((msg, index) => {
                const date = new Date(msg.received_at).toLocaleString();
                console.log(`${index + 1}. ${date} | "${msg.message_content}"`);
            });
        }
    } catch (error) {
        console.error('💥 Erro ao verificar banco:', error.message);
    }
    
    console.log('\n🎯 === DIAGNÓSTICO FINAL ===');
    console.log('PROBLEMAS POSSÍVEIS:');
    console.log('1. Evolution API credentials incorretas');
    console.log('2. Webhook não deployado com correções');
    console.log('3. Variáveis environment não configuradas no Supabase');
    console.log('4. IA Coach ainda com problema de formato');
    console.log('5. RLS policies bloqueando inserção');
    
    console.log('\n💡 === PRÓXIMOS PASSOS ===');
    console.log('1. Se Evolution API direto falha: Verificar credentials');
    console.log('2. Se webhook falha: Re-deploy com correções');
    console.log('3. Se success_with_fallback: Problema na IA Coach');
    console.log('4. Se mensagens não aparecem: Problema RLS/banco');
}

testeEvolutionSuport().catch(console.error);