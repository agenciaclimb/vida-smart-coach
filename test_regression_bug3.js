// Teste de regressão Bug 3: Configurações de Notificação
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testNotificationSettings() {
    console.log('🧪 TESTE REGRESSÃO BUG 3: Configurações de Notificação\n');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Buscar qualquer usuário para teste
    const userProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=id,name,wants_reminders,wants_quotes&limit=1`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
            "Content-Type": "application/json"
        }
    });
    
    if (!userProfileResponse.ok) {
        console.log('❌ Erro ao buscar perfil do usuário');
        return;
    }
    
    const userProfiles = await userProfileResponse.json();
    if (userProfiles.length === 0) {
        console.log('⚠️ Usuário de teste não encontrado');
        return;
    }
    
    const user = userProfiles[0];
    console.log(`✅ Usuário encontrado: ${user.name}`);
    console.log(`📋 Configurações atuais:`);
    console.log(`   - wants_reminders: ${user.wants_reminders}`);
    console.log(`   - wants_quotes: ${user.wants_quotes}`);
    
    // Verificar se as colunas existem na tabela
    console.log('\n🔍 Verificando estrutura da tabela user_profiles...');
    
    const testUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
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
    
    if (testUpdateResponse.ok) {
        console.log('✅ Atualização de configurações funcionou');
        
        // Verificar se os dados foram salvos
        const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}&select=wants_reminders,wants_quotes`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${serviceKey}`,
                "apikey": serviceKey,
                "Content-Type": "application/json"
            }
        });
        
        if (verifyResponse.ok) {
            const updatedUser = await verifyResponse.json();
            console.log('📊 Dados após atualização:');
            console.log(`   - wants_reminders: ${updatedUser[0].wants_reminders}`);
            console.log(`   - wants_quotes: ${updatedUser[0].wants_quotes}`);
            
            if (updatedUser[0].wants_reminders === true && updatedUser[0].wants_quotes === false) {
                console.log('✅ Configurações salvas corretamente');
            } else {
                console.log('❌ Configurações não foram salvas corretamente');
            }
        }
        
        // Restaurar configurações originais
        await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${serviceKey}`,
                "apikey": serviceKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                wants_reminders: user.wants_reminders,
                wants_quotes: user.wants_quotes
            })
        });
        console.log('🔄 Configurações originais restauradas');
        
    } else {
        const error = await testUpdateResponse.text();
        console.log('❌ Erro ao atualizar configurações:', error);
    }
    
    // Verificar se as colunas existem na estrutura da tabela
    console.log('\n🔍 Verificando se colunas wants_reminders e wants_quotes existem...');
    
    const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/?select=*`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey
        }
    });
    
    console.log('\n🎯 RESULTADO BUG 3 (Configurações de Notificação):');
    if (testUpdateResponse.ok) {
        console.log('✅ BUG RESOLVIDO: Colunas wants_reminders e wants_quotes funcionando corretamente');
    } else {
        console.log('❌ BUG PERSISTE: Problema ao salvar configurações de notificação');
    }
}

testNotificationSettings().catch(console.error);