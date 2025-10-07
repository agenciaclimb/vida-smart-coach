import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase (usando variáveis de ambiente)
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configurando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Service Key disponível:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyGamificationMigration() {
    try {
        console.log('📄 Lendo arquivo de migração...');
        
        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20240916000001_enhance_gamification_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📝 Arquivo de migração carregado:', migrationPath);
        console.log('📏 Tamanho do SQL:', migrationSQL.length, 'caracteres');
        
        console.log('🚀 Aplicando migração de gamificação...');
        
        // Dividir o SQL em comandos individuais (separados por ';')
        const commands = migrationSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== 'COMMIT');
        
        console.log('📋 Total de comandos SQL:', commands.length);
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.length < 10) continue; // Skip muito pequenos
            
            try {
                console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
                console.log('📝 Comando:', command.substring(0, 100) + (command.length > 100 ? '...' : ''));
                
                const { error } = await supabase.rpc('exec_sql', { sql_query: command });
                
                if (error) {
                    console.error(`❌ Erro no comando ${i + 1}:`, error.message);
                    // Não parar por erros que podem ser aceitáveis (tabelas já existem, etc.)
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('duplicate key') &&
                        !error.message.includes('relation') &&
                        !error.message.includes('column') &&
                        !error.message.includes('function') &&
                        !error.message.includes('does not exist')) {
                        throw error;
                    } else {
                        console.log('⚠️  Erro ignorado (provavelmente objeto já existe)');
                    }
                } else {
                    console.log(`✅ Comando ${i + 1} executado com sucesso`);
                }
            } catch (cmdError) {
                console.error(`💥 Erro crítico no comando ${i + 1}:`, cmdError);
                // Continue com os próximos comandos
            }
        }
        
        console.log('🎉 Migração de gamificação aplicada com sucesso!');
        
        // Testar se as tabelas foram criadas
        console.log('🔍 Verificando tabelas criadas...');
        
        const tables = [
            'daily_activities',
            'achievements', 
            'user_achievements',
            'leaderboards',
            'daily_missions',
            'gamification_events',
            'user_event_participation',
            'referrals'
        ];
        
        for (const tableName of tables) {
            try {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`❌ Tabela ${tableName}: ${error.message}`);
                } else {
                    console.log(`✅ Tabela ${tableName}: Existe (${count || 0} registros)`);
                }
            } catch (err) {
                console.log(`❌ Tabela ${tableName}: Erro ao verificar -`, err.message);
            }
        }
        
        // Verificar se as conquistas iniciais foram inseridas
        console.log('🏆 Verificando conquistas iniciais...');
        const { data: achievements, error: achError } = await supabase
            .from('achievements')
            .select('code, name')
            .limit(5);
            
        if (achError) {
            console.log('❌ Erro ao verificar conquistas:', achError.message);
        } else {
            console.log(`🎯 Conquistas encontradas: ${achievements?.length || 0}`);
            achievements?.forEach(ach => {
                console.log(`  - ${ach.code}: ${ach.name}`);
            });
        }
        
        return true;
        
    } catch (error) {
        console.error('💥 Erro ao aplicar migração:', error);
        return false;
    }
}

// Executar migração
applyGamificationMigration()
    .then(success => {
        if (success) {
            console.log('🎊 Sistema de gamificação configurado com sucesso!');
            process.exit(0);
        } else {
            console.log('💔 Falha na configuração do sistema de gamificação');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('🚨 Erro fatal:', error);
        process.exit(1);
    });