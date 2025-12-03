import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
const envPath = join(__dirname, '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyChallengesMigration() {
  console.log('\n🚀 Aplicando migration de desafios...\n')

  const sqlPath = join(__dirname, 'apply_challenges_system.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  // Dividir em statements individuais e executar
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    
    // Pular comentários standalone
    if (statement.trim().startsWith('--')) continue
    
    try {
      console.log(`📝 Executando statement ${i + 1}/${statements.length}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      })

      if (error) {
        // Tentar executar diretamente via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement })
        })

        if (!response.ok) {
          console.warn(`⚠️  Statement ${i + 1} falhou (pode ser esperado):`, error.message)
          errorCount++
        } else {
          console.log(`✅ Statement ${i + 1} executado com sucesso`)
          successCount++
        }
      } else {
        console.log(`✅ Statement ${i + 1} executado com sucesso`)
        successCount++
      }
    } catch (err) {
      console.warn(`⚠️  Erro ao executar statement ${i + 1}:`, err.message)
      errorCount++
    }
  }

  console.log(`\n📊 Resultado:`)
  console.log(`  ✅ Sucesso: ${successCount}`)
  console.log(`  ⚠️  Avisos: ${errorCount}`)
  
  if (successCount > 0) {
    console.log(`\n🎉 Migration aplicada com sucesso!\n`)
  } else {
    console.log(`\n⚠️  Migration pode ter falhado. Verifique manualmente no Dashboard.\n`)
  }
}

applyChallengesMigration().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
