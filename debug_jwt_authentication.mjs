// 🚨 CORREÇÃO URGENTE - JWT Invalid na IA Coach
// O problema está na autenticação entre webhook e IA Coach

import { createClient } from '@supabase/supabase-js';

async function testeJWTAuthentication() {
    console.log('🔧 === TESTE AUTENTICAÇÃO JWT ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    
    // Testar diferentes chaves
    const keys = {
        anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxMjcyNDksImV4cCI6MjA0NzcwMzI0OX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE',
        // Precisamos da service_role key para edge functions
    };
    
    console.log('1️⃣ Testando ANON KEY com IA Coach...');
    try {
        const anonTest = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${keys.anon}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Teste JWT',
                phone: '5516981459950',
                channel: 'whatsapp'
            })
        });
        
        console.log('   Status ANON:', anonTest.status);
        
        if (!anonTest.ok) {
            const errorText = await anonTest.text();
            console.log('   Erro ANON:', errorText);
        } else {
            const response = await anonTest.json();
            console.log('   ✅ ANON funcionou:', response);
        }
    } catch (error) {
        console.error('   💥 Erro ANON:', error.message);
    }
    
    console.log('\n2️⃣ === PROBLEMA IDENTIFICADO ===');
    console.log('🔴 IA Coach retorna 401 - Invalid JWT');
    console.log('🔴 Webhook não consegue chamar IA Coach');
    console.log('🔴 Sem resposta da IA = WhatsApp não responde');
    
    console.log('\n3️⃣ === SOLUÇÕES POSSÍVEIS ===');
    console.log('OPÇÃO 1: Usar SERVICE_ROLE key no webhook');
    console.log('OPÇÃO 2: Configurar RLS para permitir ANON key');
    console.log('OPÇÃO 3: Simplificar autenticação na IA Coach');
    
    console.log('\n4️⃣ === VERIFICAR CONFIGURAÇÃO ATUAL ===');
    console.log('O webhook está usando SUPABASE_ANON_KEY para chamar IA Coach');
    console.log('Mas IA Coach pode estar esperando SERVICE_ROLE_KEY');
    
    console.log('\n💡 === CORREÇÃO IMEDIATA ===');
    console.log('1. Verificar que chave JWT a IA Coach está esperando');
    console.log('2. Ajustar webhook para usar a chave correta');
    console.log('3. Ou ajustar IA Coach para aceitar ANON key');
}

testeJWTAuthentication().catch(console.error);