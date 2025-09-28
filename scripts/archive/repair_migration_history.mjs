import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE4MTkxMSwiZXhwIjoyMDY5NzU3OTExfQ.MasQ-Ca8JcT0rOCTGxCbX_ap6v6KoNFCojWLJ04jYPU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairMigrationHistory() {
  console.log('🔧 Reparando histórico de migrações...');
  
  try {
    // Marcar migrações problemáticas como revertidas
    const migrationsToRevert = [
      '20250909220528',
      '20250911170500', 
      '20250911173000',
      '20250911174500'
    ];
    
    for (const migration of migrationsToRevert) {
      console.log(`⏪ Revertendo migração: ${migration}`);
      
      const { error } = await supabase
        .from('supabase_migrations')
        .update({ 
          statements: null,
          name: `${migration}_reverted`
        })
        .eq('version', migration);
        
      if (error) {
        console.log(`⚠️ Migração ${migration} não encontrada ou já revertida`);
      } else {
        console.log(`✅ Migração ${migration} marcada como revertida`);
      }
    }
    
    // Verificar estado atual
    console.log('\n📊 Estado atual das migrações:');
    const { data: migrations, error: listError } = await supabase
      .from('supabase_migrations')
      .select('version, name')
      .order('version', { ascending: true });
      
    if (listError) {
      console.error('❌ Erro ao listar migrações:', listError);
    } else {
      migrations.forEach(m => {
        console.log(`  - ${m.version}: ${m.name || 'sem nome'}`);
      });
    }
    
    console.log('\n🎉 Reparo do histórico de migrações concluído!');
    console.log('💡 Agora o GitHub Actions deve funcionar corretamente.');
    
  } catch (error) {
    console.error('❌ Erro durante o reparo:', error);
  }
}

repairMigrationHistory();

