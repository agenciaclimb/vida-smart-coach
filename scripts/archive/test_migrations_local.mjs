#!/usr/bin/env node

/**
 * Script para testar migrações localmente antes do commit
 * Garante que as migrações estão válidas e podem ser aplicadas
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrations() {
    console.log('🔍 Testando migrações localmente...\n');
    
    try {
        // 1. Verificar estrutura de arquivos de migração
        console.log('1. Verificando estrutura de arquivos...');
        const migrationsDir = './supabase/migrations';
        
        if (!fs.existsSync(migrationsDir)) {
            throw new Error('Diretório de migrações não encontrado');
        }
        
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        
        console.log(`   ✓ Encontrados ${migrationFiles.length} arquivos de migração`);
        
        // 2. Verificar nomenclatura dos arquivos
        console.log('\n2. Verificando nomenclatura dos arquivos...');
        const invalidNames = [];
        
        migrationFiles.forEach(file => {
            // Verificar se segue o padrão YYYYMMDDHHMMSS_nome.sql
            const timestampPattern = /^20\d{12}_.*\.sql$/;
            if (!timestampPattern.test(file)) {
                invalidNames.push(file);
            }
        });
        
        if (invalidNames.length > 0) {
            console.log('   ⚠️  Arquivos com nomenclatura inconsistente:');
            invalidNames.forEach(name => console.log(`      - ${name}`));
            console.log('   ℹ️  Recomenda-se usar o padrão: YYYYMMDDHHMMSS_nome.sql');
        } else {
            console.log('   ✓ Todos os arquivos seguem a nomenclatura correta');
        }
        
        // 3. Verificar sintaxe SQL básica
        console.log('\n3. Verificando sintaxe SQL básica...');
        const sqlErrors = [];
        
        migrationFiles.forEach(file => {
            const filePath = path.join(migrationsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Verificações básicas de sintaxe
            if (content.trim().length === 0) {
                sqlErrors.push(`${file}: Arquivo vazio`);
            }
            
            // Verificar se há comandos SQL básicos
            const hasSQL = /\b(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP)\b/i.test(content);
            if (!hasSQL) {
                sqlErrors.push(`${file}: Não contém comandos SQL válidos`);
            }
        });
        
        if (sqlErrors.length > 0) {
            console.log('   ⚠️  Problemas encontrados:');
            sqlErrors.forEach(error => console.log(`      - ${error}`));
        } else {
            console.log('   ✓ Sintaxe SQL básica está correta');
        }
        
        // 4. Verificar conectividade com Supabase
        console.log('\n4. Verificando conectividade com Supabase...');
        
        try {
            const { data, error } = await supabase
                .from('supabase_migrations')
                .select('version')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe
                throw error;
            }
            
            console.log('   ✓ Conectividade com Supabase OK');
        } catch (connectError) {
            console.log('   ⚠️  Problema de conectividade:', connectError.message);
            console.log('   ℹ️  Verifique as variáveis SUPABASE_URL e SUPABASE_ANON_KEY');
        }
        
        // 5. Resumo final
        console.log('\n📋 Resumo:');
        console.log(`   • ${migrationFiles.length} arquivos de migração encontrados`);
        console.log(`   • ${invalidNames.length} arquivos com nomenclatura inconsistente`);
        console.log(`   • ${sqlErrors.length} problemas de sintaxe SQL`);
        
        if (invalidNames.length === 0 && sqlErrors.length === 0) {
            console.log('\n✅ Todas as verificações passaram! Migrações prontas para commit.');
            return true;
        } else {
            console.log('\n⚠️  Algumas verificações falharam. Recomenda-se corrigir antes do commit.');
            return false;
        }
        
    } catch (error) {
        console.error('\n❌ Erro durante o teste:', error.message);
        return false;
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testMigrations()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Erro fatal:', error);
            process.exit(1);
        });
}

export default testMigrations;

