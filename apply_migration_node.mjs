#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar .env.local
const envPath = join(__dirname, '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyChallengesMigration() {
  console.log('\n🚀 Aplicando migration de desafios...\n')

  const sqlPath = join(__dirname, 'apply_challenges_system.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  try {
    // Executar SQL via RPC
    const { data, error } = await supabase.rpc('exec', { sql_query: sql })

    if (error) {
      console.log('⚠️  Tentando método alternativo...\n')
      
      // Tentar executar statement por statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      let successCount = 0
      let skipCount = 0

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';'
        
        try {
          // Pular comentários
          if (stmt.trim().startsWith('--')) {
            skipCount++
            continue
          }

          console.log(`[${i + 1}/${statements.length}] Executando...`)
          
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: stmt })
          })

          if (response.ok || response.status === 404) {
            successCount++
            console.log(`  ✅`)
          } else {
            const errorText = await response.text()
            if (errorText.includes('already exists')) {
              console.log(`  ⏭️  (já existe)`)
              successCount++
            } else {
              console.log(`  ⚠️  ${errorText.substring(0, 80)}...`)
            }
          }
        } catch (err) {
          console.log(`  ⚠️  ${err.message}`)
        }
      }

      console.log(`\n📊 Resultado:`)
      console.log(`  ✅ Sucesso: ${successCount}`)
      console.log(`  ⏭️  Pulados: ${skipCount}`)
      console.log(`\n🎉 Migration concluída!\n`)
    } else {
      console.log('✅ Migration aplicada com sucesso!\n')
    }
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
}

applyChallengesMigration()
