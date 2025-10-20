// Debug IA Coach URL e autenticação
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testIACoachURL() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🔍 Testando URLs do IA Coach...\n');
    
    console.log('SUPABASE_URL:', supabaseUrl);
    console.log('SERVICE_KEY length:', serviceKey ? serviceKey.length : 'UNDEFINED');
    console.log('ANON_KEY length:', anonKey ? anonKey.length : 'UNDEFINED');
    console.log();
    
    // Teste 1: URL completa com SERVICE_KEY
    const fullUrl = `${supabaseUrl}/functions/v1/ia-coach-chat`;
    console.log('📍 URL Completa:', fullUrl);
    
    console.log('\n🔑 TESTE 1: Com SERVICE_ROLE_KEY...');
    try {
        const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
                messageContent: "Teste de conectividade",
                userProfile: { id: "test", name: "Teste" },
                chatHistory: []
            }),
        });
        
        console.log('📊 Status:', response.status, response.statusText);
        const responseText = await response.text();
        console.log('� Response Body:', responseText);
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
    
    // Teste 2: Com ANON_KEY
    console.log('\n🔑 TESTE 2: Com ANON_KEY...');
    try {
        const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
                messageContent: "Teste de conectividade",
                userProfile: { id: "test", name: "Teste" },
                chatHistory: []
            }),
        });
        
        console.log('📊 Status:', response.status, response.statusText);
        const responseText = await response.text();
        console.log('📝 Response Body:', responseText);
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
    
    // Teste 3: Com apikey header em vez de Authorization
    console.log('\n� TESTE 3: Com apikey header...');
    try {
        const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": anonKey,
            },
            body: JSON.stringify({
                messageContent: "Teste de conectividade",
                userProfile: { id: "test", name: "Teste" },
                chatHistory: []
            }),
        });
        
        console.log('📊 Status:', response.status, response.statusText);
        const responseText = await response.text();
        console.log('📝 Response Body:', responseText);
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
}

testIACoachURL();