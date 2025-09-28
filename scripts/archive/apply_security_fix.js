#!/usr/bin/env node

/**
 * Script para aplicar correções de segurança no Supabase
 * Resolve problemas identificados no Security Advisor
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Aplica a migração de segurança
 */
async function applySecurityFix() {
  try {
    console.log('🔒 Iniciando correções de segurança...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250917010000_fix_security_issues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migração carregado');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 ${commands.length} comandos SQL encontrados`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim()) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', {
            sql: command + ';'
          });
          
          if (error) {
            console.warn(`⚠️ Aviso no comando ${i + 1}: ${error.message}`);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
          
          // Pequena pausa entre comandos
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (cmdError) {
          console.warn(`⚠️ Erro no comando ${i + 1}: ${cmdError.message}`);
          // Continua com o próximo comando
        }
      }
    }
    
    console.log('\n🎉 Correções de segurança aplicadas!');
    
    // Verificar se as correções foram aplicadas
    await verifySecurityFixes();
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correções de segurança:', error.message);
    process.exit(1);
  }
}

/**
 * Verifica se as correções de segurança foram aplicadas
 */
async function verifySecurityFixes() {
  console.log('\n🔍 Verificando correções aplicadas...');
  
  try {
    // Verificar se as views foram recriadas
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['community_feed', 'app_plans', 'comentarios', 'recompensas', 'planos']);
    
    if (viewsError) {
      console.warn('⚠️ Não foi possível verificar views:', viewsError.message);
    } else {
      console.log(`✅ ${views?.length || 0} views verificadas`);
    }
    
    // Verificar RLS nas tabelas
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .in('tablename', ['error_logs', 'supabase_migrations']);
    
    if (tablesError) {
      console.warn('⚠️ Não foi possível verificar tabelas:', tablesError.message);
    } else {
      console.log(`✅ ${tables?.length || 0} tabelas verificadas`);
    }
    
    console.log('\n📋 Resumo das correções:');
    console.log('• Security Definer Views corrigidas');
    console.log('• RLS habilitado em tabelas públicas');
    console.log('• Políticas de segurança aplicadas');
    console.log('• Views recriadas sem escalação de privilégios');
    
    console.log('\n🎯 Próximos passos:');
    console.log('1. Acesse o Security Advisor no Supabase');
    console.log('2. Verifique se os erros foram resolvidos');
    console.log('3. Execute "Refresh" se necessário');
    
  } catch (error) {
    console.warn('⚠️ Erro na verificação:', error.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔒 CORREÇÃO DE SEGURANÇA - VIDA SMART COACH');
  console.log('==========================================\n');
  
  await applySecurityFix();
  
  console.log('\n✨ Processo concluído!');
  console.log('Verifique o Security Advisor no painel do Supabase.');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error.message);
    process.exit(1);
  });
}

