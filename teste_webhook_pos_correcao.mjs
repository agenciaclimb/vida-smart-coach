// 🔍 TESTE DIRETO - Verificar se webhook está funcionando após correção
// Testar especificamente com as variáveis corretas

import { createClient } from '@supabase/supabase-js';

async function testeWebhookPosCorrecao() {
    console.log('🔍 === TESTE WEBHOOK PÓS-CORREÇÃO ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';
    
    console.log('1️⃣ === VERIFICAR MENSAGENS RECENTES ===');
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Últimas 10 mensagens
        const { data: recentMessages, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
        } else {
            console.log(`📱 Últimas 10 mensagens WhatsApp:`);
            recentMessages.forEach((msg, index) => {
                const date = new Date(msg.timestamp).toLocaleString();
                const tipo = msg.event === 'messages.upsert' ? '👤 USER' : 
                           msg.event === 'ia_response' ? '🤖 BOT' : '❓ ' + msg.event;
                console.log(`${index + 1}. ${tipo} | ${date} | "${msg.message}"`);
            });
            
            // Análise específica
            const ultimasMensagens = recentMessages.slice(0, 5);
            const userMsgs = ultimasMensagens.filter(m => m.event === 'messages.upsert');
            const botMsgs = ultimasMensagens.filter(m => m.event === 'ia_response');
            
            console.log(`\n📊 ÚLTIMAS 5 MENSAGENS:`);
            console.log(`   👤 Mensagens do usuário: ${userMsgs.length}`);
            console.log(`   🤖 Respostas do bot: ${botMsgs.length}`);
            
            if (userMsgs.length > 0 && botMsgs.length === 0) {
                console.log('   🚨 PROBLEMA: Usuário enviou mensagens mas bot não respondeu!');
            }
        }
    } catch (error) {
        console.error('💥 Erro ao verificar mensagens:', error.message);
    }
    
    console.log('\n2️⃣ === TESTE WEBHOOK COM PAYLOAD REAL ===');
    try {
        const testTime = new Date().toLocaleTimeString();
        const testMessage = `Teste pós-correção ${testTime}`;
        
        const webhookPayload = {
            event: 'messages.upsert',
            data: {
                key: {
                    remoteJid: '5516981459950@s.whatsapp.net',
                    id: 'test-pos-correcao-' + Date.now(),
                    fromMe: false
                },
                message: {
                    conversation: testMessage
                }
            }
        };
        
        console.log(`🧪 Testando webhook com: "${testMessage}"`);
        
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/evolution-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify(webhookPayload)
        });
        
        console.log('📥 Webhook Response Status:', webhookResponse.status);
        console.log('📥 Webhook Response Headers:', Object.fromEntries(webhookResponse.headers.entries()));
        
        if (webhookResponse.ok) {
            const result = await webhookResponse.json();
            console.log('✅ Webhook Success:', JSON.stringify(result, null, 2));
            
            if (result.status === 'success') {
                console.log('🎉 WEBHOOK FUNCIONOU! IA deve ter respondido');
            } else if (result.status === 'success_with_fallback') {
                console.log('⚠️ WEBHOOK USOU FALLBACK! IA Coach falhou');
            }
        } else {
            const errorText = await webhookResponse.text();
            console.log('❌ Webhook Error:', errorText);
            
            // Analisar erro
            if (errorText.includes('Evolution API não configurada')) {
                console.log('🔍 AINDA PROBLEMA COM EVOLUTION VARIABLES!');
            } else if (errorText.includes('Invalid JWT')) {
                console.log('🔍 AINDA PROBLEMA COM JWT!');
            }
        }
    } catch (error) {
        console.error('💥 Erro no teste webhook:', error.message);
    }
    
    console.log('\n3️⃣ === CHECKLIST PROBLEMAS POSSÍVEIS ===');
    console.log('PROBLEMA 1: 🔴 Variáveis não configuradas no Supabase Environment');
    console.log('   Solução: Ir para Edge Functions → evolution-webhook → Settings');
    console.log('   Adicionar: EVOLUTION_API_KEY, EVOLUTION_API_URL, EVOLUTION_INSTANCE_ID');
    console.log('   Adicionar: SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('\nPROBLEMA 2: 🔴 Webhook ainda não foi re-deployado');
    console.log('   Solução: Copiar código corrigido e salvar no Supabase');
    
    console.log('\nPROBLEMA 3: 🔴 Evolution API mudou formato');
    console.log('   Solução: Verificar se Evolution ainda aceita o formato atual');
    
    console.log('\nPROBLEMA 4: 🔴 RLS policies mudaram');
    console.log('   Solução: Verificar se SERVICE_ROLE_KEY pode inserir em whatsapp_messages');
    
    console.log('\n4️⃣ === PRÓXIMOS PASSOS ===');
    console.log('1. ✅ Verificar se variáveis estão no Supabase Environment');
    console.log('2. ✅ Re-deploy do webhook com código corrigido');
    console.log('3. ✅ Testar manualmente no Supabase Dashboard');
    console.log('4. ✅ Verificar logs em tempo real durante teste');
    
    console.log('\n💡 === TESTE MANUAL NO SUPABASE ===');
    console.log('Para testar no Supabase Dashboard:');
    console.log('1. Vá para Edge Functions → evolution-webhook');
    console.log('2. Clique em "Invoke Function"');
    console.log('3. Cole este JSON:');
    console.log(JSON.stringify({
        event: 'messages.upsert',
        data: {
            key: {
                remoteJid: '5516981459950@s.whatsapp.net',
                id: 'manual-test-dashboard'
            },
            message: {
                conversation: 'Teste manual do dashboard Supabase'
            }
        }
    }, null, 2));
    console.log('4. Execute e veja os logs em tempo real');
}

testeWebhookPosCorrecao().catch(console.error);