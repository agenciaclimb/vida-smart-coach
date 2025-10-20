// Debug simples para Bug 3
import { config } from 'dotenv';
config({ path: '.env.local' });

async function debugBug3() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 Debug Bug 3: Configurações de Notificação\n');
    console.log('URL:', supabaseUrl);
    console.log('Service Key length:', serviceKey?.length);
    
    // Teste básico - buscar qualquer coisa na tabela user_profiles
    console.log('\n1. Testando acesso básico à tabela user_profiles...');
    const basicResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=id&limit=1`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
            "Content-Type": "application/json"
        }
    });
    
    console.log('Status:', basicResponse.status);
    
    if (!basicResponse.ok) {
        const error = await basicResponse.text();
        console.log('Erro:', error);
    } else {
        const data = await basicResponse.json();
        console.log('✅ Acesso básico funcionou, registros encontrados:', data.length);
        
        if (data.length > 0) {
            const userId = data[0].id;
            
            // Teste 2: Verificar se colunas wants_reminders e wants_quotes existem
            console.log('\n2. Testando acesso às colunas wants_reminders e wants_quotes...');
            const columnResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=wants_reminders,wants_quotes`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${serviceKey}`,
                    "apikey": serviceKey,
                    "Content-Type": "application/json"
                }
            });
            
            console.log('Status columns:', columnResponse.status);
            
            if (!columnResponse.ok) {
                const error = await columnResponse.text();
                console.log('❌ PROBLEMA: Colunas wants_reminders/wants_quotes não existem ou erro de acesso');
                console.log('Erro:', error);
            } else {
                const columnData = await columnResponse.json();
                console.log('✅ Colunas existem:', columnData[0]);
                
                // Teste 3: Tentar atualizar
                console.log('\n3. Testando atualização das configurações...');
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${serviceKey}`,
                        "apikey": serviceKey,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        wants_reminders: true,
                        wants_quotes: false
                    })
                });
                
                console.log('Status update:', updateResponse.status);
                
                if (updateResponse.ok) {
                    console.log('✅ BUG 3 RESOLVIDO: Configurações de notificação funcionando');
                } else {
                    const updateError = await updateResponse.text();
                    console.log('❌ BUG 3 PERSISTE: Erro ao atualizar configurações');
                    console.log('Erro update:', updateError);
                }
            }
        }
    }
}

debugBug3().catch(console.error);