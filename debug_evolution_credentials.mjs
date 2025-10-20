// 🔍 DIAGNÓSTICO EVOLUTION API CREDENTIALS
// Vamos verificar se as credenciais mudaram

async function verificarCredencialsEvolution() {
    console.log('🔑 === VERIFICAÇÃO CREDENTIALS EVOLUTION ===\n');
    
    // Credenciais que estão sendo usadas
    const credentialsAtuais = {
        apiKey: 'bad6ff73-1582-4464-b231-5f6752f3a6fb',
        baseUrl: 'https://api.evoapicloud.com',
        instanceId: 'd8cfea03-bf0f-4ce0-a8aa-2faaec309bfd'
    };
    
    console.log('📋 Credenciais atuais em uso:');
    console.log('API Key:', credentialsAtuais.apiKey);
    console.log('Base URL:', credentialsAtuais.baseUrl);
    console.log('Instance ID:', credentialsAtuais.instanceId);
    
    console.log('\n🧪 === TESTE BASIC ENDPOINT EVOLUTION ===');
    
    // Teste 1: Endpoint de info da instância (se existir)
    try {
        const infoUrl = `${credentialsAtuais.baseUrl}/instance/info/${credentialsAtuais.instanceId}`;
        console.log('Testando endpoint info:', infoUrl);
        
        const response = await fetch(infoUrl, {
            method: 'GET',
            headers: {
                'apikey': credentialsAtuais.apiKey
            }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const info = await response.json();
            console.log('✅ Instance info:', JSON.stringify(info, null, 2));
        } else {
            const error = await response.text();
            console.log('❌ Instance info error:', error);
        }
    } catch (error) {
        console.log('💥 Erro ao testar info:', error.message);
    }
    
    // Teste 2: Verificar se a instância existe
    console.log('\n🧪 === TESTE INSTANCE STATUS ===');
    try {
        const statusUrl = `${credentialsAtuais.baseUrl}/instance/status/${credentialsAtuais.instanceId}`;
        console.log('Testando status:', statusUrl);
        
        const response = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'apikey': credentialsAtuais.apiKey
            }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const status = await response.json();
            console.log('✅ Instance status:', JSON.stringify(status, null, 2));
        } else {
            const error = await response.text();
            console.log('❌ Instance status error:', error);
        }
    } catch (error) {
        console.log('💥 Erro ao testar status:', error.message);
    }
    
    // Teste 3: Tentar listar instâncias (sem instance ID)
    console.log('\n🧪 === TESTE LIST INSTANCES ===');
    try {
        const listUrl = `${credentialsAtuais.baseUrl}/instance/list`;
        console.log('Testando list:', listUrl);
        
        const response = await fetch(listUrl, {
            method: 'GET',
            headers: {
                'apikey': credentialsAtuais.apiKey
            }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const instances = await response.json();
            console.log('✅ Instances list:', JSON.stringify(instances, null, 2));
        } else {
            const error = await response.text();
            console.log('❌ List error:', error);
        }
    } catch (error) {
        console.log('💥 Erro ao listar:', error.message);
    }
    
    // Teste 4: Diferentes formatos de header
    console.log('\n🧪 === TESTE DIFERENTES HEADERS ===');
    
    const headerVariations = [
        { name: 'apikey', value: credentialsAtuais.apiKey },
        { name: 'Authorization', value: `Bearer ${credentialsAtuais.apiKey}` },
        { name: 'x-api-key', value: credentialsAtuais.apiKey },
        { name: 'api-key', value: credentialsAtuais.apiKey }
    ];
    
    for (const header of headerVariations) {
        try {
            console.log(`\nTestando header: ${header.name}`);
            
            const response = await fetch(`${credentialsAtuais.baseUrl}/instance/status/${credentialsAtuais.instanceId}`, {
                method: 'GET',
                headers: {
                    [header.name]: header.value
                }
            });
            
            console.log(`${header.name} - Status:`, response.status);
            
            if (response.ok) {
                console.log(`✅ ${header.name} funcionou!`);
                const result = await response.json();
                console.log('Response:', JSON.stringify(result, null, 2));
                break; // Se funcionou, para os testes
            } else {
                const error = await response.text();
                console.log(`❌ ${header.name} error:`, error);
            }
        } catch (error) {
            console.log(`💥 ${header.name} exception:`, error.message);
        }
    }
    
    console.log('\n💡 === CONCLUSÕES ===');
    console.log('1. Se TODOS os testes falharam com 401: API Key inválida');
    console.log('2. Se alguns funcionaram: Problema no endpoint sendText');
    console.log('3. Se nenhum endpoint funcionou: URL base incorreta');
    console.log('4. Verificar se a Evolution API mudou de plataforma');
    console.log('5. Verificar se o plano expirou ou foi suspenso');
    
    console.log('\n🔧 === AÇÕES RECOMENDADAS ===');
    console.log('1. Verificar no painel Evolution se a instância ainda existe');
    console.log('2. Regenerar nova API Key se necessário');
    console.log('3. Verificar se mudou de https://api.evoapicloud.com');
    console.log('4. Confirmar se o instanceId não mudou');
}

verificarCredencialsEvolution().catch(console.error);