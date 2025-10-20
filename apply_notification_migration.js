// Aplicar migração de notificações manualmente
import { config } from 'dotenv';
config({ path: '.env.local' });

async function applyNotificationMigration() {
    console.log('🔧 Aplicando migração de notificações manualmente...\n');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const migrationSQL = `
-- Add notification preferences to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS wants_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wants_quotes BOOLEAN DEFAULT true;

-- Update existing users to have notifications enabled by default
UPDATE user_profiles 
SET 
    wants_reminders = COALESCE(wants_reminders, true),
    wants_quotes = COALESCE(wants_quotes, true)
WHERE wants_reminders IS NULL OR wants_quotes IS NULL;
`;
    
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${serviceKey}`,
                "apikey": serviceKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sql: migrationSQL
            })
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            console.log('✅ Migração aplicada com sucesso!');
            
            // Verificar se as colunas foram criadas
            const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=wants_reminders,wants_quotes&limit=1`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${serviceKey}`,
                    "apikey": serviceKey,
                    "Content-Type": "application/json"
                }
            });
            
            if (verifyResponse.ok) {
                const data = await verifyResponse.json();
                console.log('✅ Verificação: Colunas criadas e dados:', data[0]);
            } else {
                console.log('⚠️ Erro na verificação:', await verifyResponse.text());
            }
            
        } else {
            const error = await response.text();
            console.log('❌ Erro ao aplicar migração:', error);
            
            // Tentar método alternativo - executar comandos individualmente
            console.log('\n🔄 Tentando método alternativo...');
            
            const alterResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${serviceKey}`,
                    "apikey": serviceKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sql: "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wants_reminders BOOLEAN DEFAULT true, ADD COLUMN IF NOT EXISTS wants_quotes BOOLEAN DEFAULT true;"
                })
            });
            
            if (alterResponse.ok) {
                console.log('✅ Colunas adicionadas com sucesso!');
            } else {
                console.log('❌ Falha no método alternativo:', await alterResponse.text());
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na execução:', error);
    }
}

applyNotificationMigration();