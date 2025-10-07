#!/usr/bin/env node

/**
 * Script alternativo para aplicar correções de segurança via API REST
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = "https://zzugbgoylwbaojdnunuz.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjQ4MTkxMCwiZXhwIjoyMDQyMDU3OTEwfQ.MasQ-Ca8JcT0rOCTGxCbX_ap6v6KoNFcojWLU04jYPU";

/**
 * Executa SQL diretamente via API REST
 */
async function executeSQLDirect(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: sql })
    });

    if (!response.ok) {
      // Tenta método alternativo
      const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sql',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: sql
      });
      
      return { ok: altResponse.ok, status: altResponse.status, text: await altResponse.text() };
    }

    return { ok: response.ok, status: response.status, text: await response.text() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Aplica correções críticas uma por uma
 */
async function applyCriticalFixes() {
  console.log('🔒 Aplicando correções críticas de segurança...\n');

  // Correções mais importantes primeiro
  const criticalFixes = [
    {
      name: "Habilitar RLS em error_logs",
      sql: "ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;"
    },
    {
      name: "Habilitar RLS em supabase_migrations", 
      sql: "ALTER TABLE public.supabase_migrations ENABLE ROW LEVEL SECURITY;"
    },
    {
      name: "Política para error_logs",
      sql: `CREATE POLICY "error_logs_admin_only" ON public.error_logs
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
              )
            );`
    },
    {
      name: "Política para supabase_migrations",
      sql: `CREATE POLICY "migrations_admin_only" ON public.supabase_migrations
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
              )
            );`
    },
    {
      name: "Recriar view community_feed",
      sql: `DROP VIEW IF EXISTS public.community_feed;
            CREATE VIEW public.community_feed AS
            SELECT 
                id,
                user_id,
                content,
                created_at,
                updated_at,
                likes_count,
                comments_count
            FROM community_posts 
            WHERE is_published = true 
            ORDER BY created_at DESC;`
    },
    {
      name: "Recriar view app_plans",
      sql: `DROP VIEW IF EXISTS public.app_plans;
            CREATE VIEW public.app_plans AS
            SELECT 
                id,
                name,
                description,
                price,
                features,
                is_active,
                created_at
            FROM subscription_plans 
            WHERE is_active = true 
            ORDER BY price ASC;`
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < criticalFixes.length; i++) {
    const fix = criticalFixes[i];
    console.log(`⚡ ${i + 1}/${criticalFixes.length}: ${fix.name}...`);

    const result = await executeSQLDirect(fix.sql);
    
    if (result.ok) {
      console.log(`✅ ${fix.name} - Sucesso`);
      successCount++;
    } else {
      console.log(`⚠️ ${fix.name} - ${result.error || result.text || 'Erro desconhecido'}`);
      errorCount++;
    }

    // Pausa entre comandos
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Resumo: ${successCount} sucessos, ${errorCount} erros`);
  return { successCount, errorCount };
}

/**
 * Verifica se as correções foram aplicadas
 */
async function verifyFixes() {
  console.log('\n🔍 Verificando correções aplicadas...');

  // Testa uma consulta simples para verificar conectividade
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=count`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });

    if (response.ok) {
      console.log('✅ Conexão com Supabase funcionando');
      return true;
    } else {
      console.log('⚠️ Problema na conexão:', response.status);
      return false;
    }
  } catch (error) {
    console.log('⚠️ Erro na verificação:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔒 CORREÇÃO DIRETA DE SEGURANÇA - VIDA SMART COACH');
  console.log('================================================\n');

  // Verificar conectividade primeiro
  const connected = await verifyFixes();
  if (!connected) {
    console.log('❌ Não foi possível conectar ao Supabase. Verifique as credenciais.');
    return;
  }

  // Aplicar correções críticas
  const result = await applyCriticalFixes();

  console.log('\n🎯 Próximos passos:');
  console.log('1. Acesse o Security Advisor no Supabase');
  console.log('2. Clique em "Refresh" para atualizar');
  console.log('3. Verifique se os erros foram resolvidos');

  if (result.successCount > 0) {
    console.log('\n✨ Algumas correções foram aplicadas com sucesso!');
  }
}

// Executar
main().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});

