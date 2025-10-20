// 🔍 VERIFICAR ESTRUTURA TABELA whatsapp_messages
// Para entender que campos existem na tabela

import { createClient } from '@supabase/supabase-js';

async function verificarTabela() {
    console.log('🔍 === VERIFICAR ESTRUTURA TABELA ===\n');
    
    const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('1️⃣ === BUSCAR UMA MENSAGEM PARA VER CAMPOS ===');
    try {
        const { data: mensagens, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Erro ao buscar mensagem:', error);
        } else if (mensagens && mensagens.length > 0) {
            console.log('✅ Estrutura da tabela (campos disponíveis):');
            const campos = Object.keys(mensagens[0]);
            campos.forEach(campo => {
                const valor = mensagens[0][campo];
                console.log(`   ${campo}: ${typeof valor} = ${valor}`);
            });
        } else {
            console.log('⚠️ Nenhuma mensagem encontrada na tabela');
        }
    } catch (error) {
        console.error('💥 Erro ao verificar tabela:', error.message);
    }
    
    console.log('\n2️⃣ === TESTE INSERT SIMPLES ===');
    try {
        const testMessage = {
            phone: '5516981459950',
            message: 'Teste estrutura tabela',
            event: 'test'
        };
        
        console.log('🧪 Tentando inserir:', testMessage);
        
        const { data, error } = await supabase
            .from('whatsapp_messages')
            .insert(testMessage)
            .select('*');
            
        if (error) {
            console.error('❌ Erro no insert:', error);
            console.log('💡 Isso nos mostra que campos estão missing ou incorretos');
        } else {
            console.log('✅ Insert funcionou:', data);
        }
    } catch (error) {
        console.error('💥 Erro no teste insert:', error.message);
    }
    
    console.log('\n3️⃣ === ESTRUTURA ESPERADA vs REAL ===');
    console.log('ESPERADO pelo webhook:');
    console.log('   phone: string');
    console.log('   message: string'); 
    console.log('   event: string');
    console.log('   timestamp: number (ou created_at: datetime)');
    
    console.log('\n💡 === PRÓXIMOS PASSOS ===');
    console.log('1. Se timestamp não existe, usar created_at');
    console.log('2. Se tem campos obrigatórios missing, adicionar');
    console.log('3. Atualizar webhook para usar estrutura correta');
}

verificarTabela().catch(console.error);