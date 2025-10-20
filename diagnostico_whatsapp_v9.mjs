// 🔍 DIAGNÓSTICO COMPLETO - WhatsApp não responde após deploy v9
// Vamos verificar todos os pontos críticos

import { createClient } from '@supabase/supabase-js';

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
    
    console.log('\n4️⃣ === TESTE SIMULAÇÃO EVOLUTION API ===');
    // Vamos simular o que o webhook deveria enviar para Evolution API
    try {
        console.log('🧪 Simulando chamada Evolution API...');
        console.log('📋 Dados que deveriam ser enviados:');
        
        const evolutionPayload = {
            number: '5516981459950',
            text: 'Mensagem de teste v9'
        };
        
        console.log('   URL: https://your-evolution-url/message/sendText/your-instance');
        console.log('   Headers: { "apikey": "C26C953E32F8-4223-A0FF-755288E45822" }');
        console.log('   Body:', JSON.stringify(evolutionPayload, null, 2));
        
    } catch (error) {
        console.error('💥 Erro na simulação:', error.message);
    }
    
    console.log('\n5️⃣ === VERIFICAR ESTRUTURA TABELA ===');
    try {
        // Verificar se a estrutura da tabela está correta
        const { data: tableInfo, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Erro na tabela whatsapp_messages:', error.message);
            if (error.message.includes('user_id')) {
                console.log('🔴 PROBLEMA: Campo user_id ainda existe na tabela!');
                console.log('💡 SOLUÇÃO: Remover campo user_id da tabela');
            }
        } else {
            console.log('✅ Tabela whatsapp_messages acessível');
        }
    } catch (error) {
        console.error('💥 Erro ao verificar tabela:', error.message);
    }
    
    console.log('\n🎯 === PONTOS DE FALHA POSSÍVEIS ===');
    console.log('1. 🔴 Evolution API não está recebendo webhook');
    console.log('2. 🔴 Variáveis de ambiente não configuradas no Supabase');
    console.log('3. 🔴 Token Evolution API expirado/inválido');
    console.log('4. 🔴 URL Evolution API incorreta');
    console.log('5. 🔴 Campo user_id ainda existe na tabela');
    console.log('6. 🔴 RLS policies bloqueando inserção');
    
    console.log('\n💡 === VERIFICAÇÕES URGENTES ===');
    console.log('□ Webhook URL configurada no Evolution: https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook');
    console.log('□ Token Evolution correto: C26C953E32F8-4223-A0FF-755288E45822');
    console.log('□ Variáveis env no Supabase configuradas');
    console.log('□ Logs do Supabase mostrando execução');
    console.log('□ Mensagens sendo inseridas na tabela');
    
    console.log('\n🚨 === AÇÃO IMEDIATA ===');
    console.log('1. Verificar logs Supabase Dashboard');
    console.log('2. Testar webhook manualmente');
    console.log('3. Confirmar configuração Evolution API');
    console.log('4. Verificar variáveis de ambiente');
}

diagnosticoCompleto().catch(console.error);