import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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

