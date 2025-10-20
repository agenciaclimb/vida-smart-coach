// 🚀 TESTE PÓS-DEPLOY - Verificar se correções funcionaram
// Testar webhook após deploy com estrutura de tabela corrigida

import { createClient } from '@supabase/supabase-js';

async function testePosDeploy() {
    console.log('🚀 === TESTE PÓS-DEPLOY WEBHOOK CORRIGIDO ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';
    
    console.log('1️⃣ === VERIFICAR MENSAGENS ANTES DO TESTE ===');
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data: mensagensAntes, error } = await supabase
            .from('whatsapp_messages')
            .select('message_content, received_at')
            .order('received_at', { ascending: false })
            .limit(5);
            
        if (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
        } else {
            console.log(`📱 Últimas 5 mensagens no banco:`);
            mensagensAntes.forEach((msg, index) => {
                const date = new Date(msg.received_at).toLocaleString();
                console.log(`${index + 1}. ${date} | "${msg.message_content}"`);
            });
        }
    } catch (error) {
        console.error('💥 Erro ao verificar mensagens:', error.message);
    }
    
    console.log('\n2️⃣ === TESTE WEBHOOK COM PAYLOAD COMPLETO ===');
    try {
        const testTime = new Date().toLocaleTimeString();
        const testMessage = `Preciso de ajuda para emagrecer - teste ${testTime}`;
        
        const webhookPayload = {
            event: 'messages.upsert',
            data: {
                key: {
                    remoteJid: '5516981459950@s.whatsapp.net',
                    id: 'test-final-' + Date.now(),
                    fromMe: false
                },
                message: {
                    conversation: testMessage
                }
            }
        };
        
        console.log(`🧪 Enviando mensagem teste: "${testMessage}"`);
        console.log('📦 Payload completo:', JSON.stringify(webhookPayload, null, 2));
        
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify(webhookPayload)
        });
        
        console.log('\n📥 === RESULTADO WEBHOOK ===');
        console.log('Status:', webhookResponse.status);
        console.log('Status Text:', webhookResponse.statusText);
        
        if (webhookResponse.ok) {
            const result = await webhookResponse.json();
            console.log('✅ Resposta:', JSON.stringify(result, null, 2));
            
            if (result.status === 'success') {
                console.log('🎉 SUCESSO TOTAL! IA Coach respondeu');
                console.log('📝 Resposta da IA:', result.iaResponse);
            } else if (result.status === 'success_with_fallback') {
                console.log('⚠️ SUCESSO PARCIAL! Usou fallback');
                console.log('💡 IA Coach ainda com problema, mas webhook funcionou');
            } else {
                console.log('❓ Status inesperado:', result.status);
            }
        } else {
            const errorText = await webhookResponse.text();
            console.log('❌ Erro:', errorText);
            
            if (errorText.includes('column') && errorText.includes('does not exist')) {
                console.log('🔍 AINDA problema de estrutura da tabela!');
            } else if (errorText.includes('Evolution API')) {
                console.log('🔍 Problema com Evolution API variables');
            } else if (errorText.includes('JWT') || errorText.includes('401')) {
                console.log('🔍 Problema com autenticação');
            }
        }
    } catch (error) {
        console.error('💥 Erro no teste webhook:', error.message);
    }
    
    console.log('\n3️⃣ === VERIFICAR SE MENSAGEM FOI INSERIDA ===');
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Aguardar um pouco para garantir que foi inserida
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: mensagensDepois, error } = await supabase
            .from('whatsapp_messages')
            .select('message_content, received_at')
            .order('received_at', { ascending: false })
            .limit(3);
            
        if (error) {
            console.error('❌ Erro ao verificar inserção:', error);
        } else {
            console.log('📱 Últimas 3 mensagens após teste:');
            mensagensDepois.forEach((msg, index) => {
                const date = new Date(msg.received_at).toLocaleString();
                console.log(`${index + 1}. ${date} | "${msg.message_content}"`);
            });
            
            // Verificar se nossa mensagem foi inserida
            const mensagemTeste = mensagensDepois.find(m => 
                m.message_content.includes('Preciso de ajuda para emagrecer - teste')
            );
            
            if (mensagemTeste) {
                console.log('✅ MENSAGEM INSERIDA COM SUCESSO!');
            } else {
                console.log('❌ Mensagem de teste não foi inserida');
            }
        }
    } catch (error) {
        console.error('💥 Erro ao verificar inserção:', error.message);
    }
    
    console.log('\n4️⃣ === TESTE IA COACH ISOLADO ===');
    try {
        console.log('🧠 Testando IA Coach diretamente...');
        
        const iaResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                message: 'Preciso de ajuda para emagrecer',
                phone: '5516981459950',
                history: '',
                channel: 'whatsapp'
            })
        });
        
        console.log('🧠 IA Status:', iaResponse.status);
        
        if (iaResponse.ok) {
            const iaResult = await iaResponse.json();
            console.log('✅ IA funcionando:', iaResult.reply || iaResult.response || 'Sem resposta');
        } else {
            const errorText = await iaResponse.text();
            console.log('❌ IA Error:', errorText);
        }
    } catch (error) {
        console.error('💥 Erro teste IA:', error.message);
    }
    
    console.log('\n🎯 === DIAGNÓSTICO FINAL ===');
    console.log('CHECKLIST SUCESSO:');
    console.log('□ Webhook responde (200 OK)');
    console.log('□ Mensagem inserida na tabela');
    console.log('□ IA Coach funciona');
    console.log('□ Evolution API configurada');
    console.log('□ Status "success" (não fallback)');
    
    console.log('\n💡 === PRÓXIMOS PASSOS ===');
    console.log('Se tudo funcionou: Testar no WhatsApp real');
    console.log('Se ainda falha: Verificar logs Supabase em tempo real');
    console.log('Se usa fallback: Configurar variáveis Evolution no Supabase');
}

testePosDeploy().catch(console.error);