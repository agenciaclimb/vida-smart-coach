import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

// Try service role key if available (usually more privileged)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

async function executeMigrationDirect() {
  console.log('🚀 EXECUTANDO MIGRAÇÃO DIRETA NO SUPABASE\n');
  
  // Try with service role key first (more permissions)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('📝 Tentativa 1: Executar comandos individuais...\n');
    
    // Execute each ALTER TABLE command individually
    const commands = [
      // Add columns to user_profiles
      "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
      "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2)", 
      "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2)",
      "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(10)",
      "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50)",
      
      // Add columns to daily_checkins  
      "ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2)",
      "ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS mood_score INTEGER",
      "ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
    ];
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      console.log(`${i + 1}. Executando: ${cmd.substring(0, 80)}...`);
      
      try {
        const { data, error } = await supabaseAdmin.rpc('exec', { 
          sql: cmd 
        });
        
        if (error) {
          console.log(`   ❌ Erro: ${error.message}`);
          
          // Try alternative approach with query
          try {
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({ sql: cmd })
            });
            
            if (response.ok) {
              console.log(`   ✅ Sucesso (via fetch)`);
            } else {
              const errorText = await response.text();
              console.log(`   ❌ Fetch erro: ${errorText}`);
            }
          } catch (fetchError) {
            console.log(`   ❌ Fetch falhou: ${fetchError.message}`);
          }
        } else {
          console.log(`   ✅ Sucesso`);
        }
      } catch (cmdError) {
        console.log(`   ❌ Exception: ${cmdError.message}`);
      }
    }
    
    console.log('\n📋 Verificando se os campos foram criados...\n');
    
    // Test if the new columns exist
    const testFields = [
      { table: 'user_profiles', field: 'phone' },
      { table: 'user_profiles', field: 'current_weight' },
      { table: 'user_profiles', field: 'target_weight' }, 
      { table: 'user_profiles', field: 'gender' },
      { table: 'user_profiles', field: 'goal_type' },
      { table: 'daily_checkins', field: 'weight' },
      { table: 'daily_checkins', field: 'mood_score' }
    ];
    
    const supabaseTest = createClient(supabaseUrl, supabaseAnonKey);
    
    for (const test of testFields) {
      try {
        const { error } = await supabaseTest
          .from(test.table)
          .select(test.field)
          .limit(1);
          
        if (!error) {
          console.log(`✅ ${test.table}.${test.field} - CRIADO COM SUCESSO`);
        } else {
          console.log(`❌ ${test.table}.${test.field} - AINDA NÃO EXISTE: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${test.table}.${test.field} - ERRO: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erro geral na migração:', error);
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS SE A MIGRAÇÃO AUTOMÁTICA FALHOU:\n');
  console.log('1. Copie este SQL e execute manualmente no Supabase:');
  console.log('   👉 https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new\n');
  
  // Show the SQL to copy-paste
  const migrationSQL = fs.readFileSync('./supabase/migrations/20250915100000_add_missing_fields.sql', 'utf8');
  console.log('='.repeat(80));
  console.log('SQL PARA COPIAR E COLAR:');
  console.log('='.repeat(80));
  console.log(migrationSQL);
  console.log('='.repeat(80));
}

executeMigrationDirect().catch(console.error);