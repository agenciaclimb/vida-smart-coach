// 🧪 TESTE ESPECÍFICO IA COACH v8 - Formato correto
// Descobrir o formato exato que a IA Coach espera

import { createClient } from '@supabase/supabase-js';

async function testeIACoachFormato() {
    console.log('🧪 === TESTE IA COACH v8 - FORMATO CORRETO ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';
    
    const formatos = [
        {
            nome: 'Formato 1 - messageContent + userProfile',
            payload: {
                messageContent: 'Preciso de ajuda para emagrecer',
                userProfile: { 
                    id: 'whatsapp-user', 
                    full_name: 'Usuário WhatsApp 9950',
                    phone: '5516981459950'
                },
                chatHistory: [],
                channel: 'whatsapp'
            }
        },
        {
            nome: 'Formato 2 - message simples',
            payload: {
                message: 'Preciso de ajuda para emagrecer',
                phone: '5516981459950',
                channel: 'whatsapp'
            }
        },
        {
            nome: 'Formato 3 - text + user',
            payload: {
                text: 'Preciso de ajuda para emagrecer',
                user: {
                    id: 'whatsapp-user',
                    name: 'Usuário WhatsApp'
                }
            }
        },
        {
            nome: 'Formato 4 - content + profile',
            payload: {
                content: 'Preciso de ajuda para emagrecer',
                profile: {
                    id: 'whatsapp-user',
                    name: 'Usuário WhatsApp'
                }
            }
        }
    ];
    
    for (const formato of formatos) {
        console.log(`\n🧪 === ${formato.nome} ===`);
        console.log('📦 Payload:', JSON.stringify(formato.payload, null, 2));
        
        try {
            const response = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`
                },
                body: JSON.stringify(formato.payload)
            });
            
            console.log('📥 Status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ FUNCIONOU!');
                console.log('📝 Resposta:', JSON.stringify(result, null, 2));
                
                const reply = result.reply || result.response || result.message;
                if (reply) {
                    console.log(`🎯 Mensagem da IA: "${reply}"`);
                }
                break; // Se funcionou, parar aqui
            } else {
                const errorText = await response.text();
                console.log('❌ Erro:', errorText);
            }
        } catch (error) {
            console.error('💥 Erro:', error.message);
        }
    }
    
    console.log('\n💡 === RESULTADO ===');
    console.log('Use o formato que retornou ✅ FUNCIONOU! no webhook');
}

testeIACoachFormato().catch(console.error);