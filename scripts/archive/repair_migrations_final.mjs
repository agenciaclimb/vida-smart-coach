import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairMigrationHistory() {
    console.log('🔧 Reparando histórico de migrações...');
    
    try {
        // Marcar migrações remotas como revertidas para sincronizar
        const migrationsToRepair = [
            '20250909220528',
            '20250911170500', 
            '20250911173000',
            '20250911174500'
        ];
        
        console.log('📝 Removendo migrações órfãs do histórico...');
        
        for (const version of migrationsToRepair) {
            const { error } = await supabase
                .from('supabase_migrations')
                .delete()
                .eq('version', version);
                
            if (error) {
                console.log(`⚠️ Migração ${version} não encontrada ou já removida:`, error.message);
            } else {
                console.log(`✅ Migração ${version} removida do histórico`);
            }
        }
        
        // Verificar estado final
        const { data: remainingMigrations, error: fetchError } = await supabase
            .from('supabase_migrations')
            .select('version, name')
            .order('version');
            
        if (fetchError) {
            throw fetchError;
        }
        
        console.log('📊 Migrações restantes no histórico:');
        remainingMigrations.forEach(m => {
            console.log(`  - ${m.version}: ${m.name}`);
        });
        
        console.log('🎉 Histórico de migrações reparado com sucesso!');
        console.log('🚀 GitHub Actions deve funcionar agora!');
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Erro ao reparar histórico:', error);
        return { success: false, error };
    }
}

// Executar reparo
repairMigrationHistory()
    .then(result => {
        if (result.success) {
            console.log('✅ Reparo concluído com sucesso!');
            process.exit(0);
        } else {
            console.error('❌ Falha no reparo:', result.error);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });

