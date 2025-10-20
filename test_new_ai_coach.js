import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zzugbgoylwbaojdnunuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYXFqaWRudW51eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI0MjY3Mzk3LCJleHAiOjIwMzk4NDMzOTd9.kePTUZjXvxj38E_v8P7OlMy8MfOYSdp6pPQe-kXQk5M'
)

async function testNewIACoach() {
  console.log('🧪 Testando nova IA Coach...')
  
  try {
    const { data, error } = await supabase.functions.invoke('ia-coach-chat', {
      body: {
        messageContent: 'Oi, quero começar um plano de exercícios',
        userProfile: {
          id: 'test-user',
          full_name: 'João',
          created_at: new Date().toISOString()
        },
        chatHistory: []
      }
    })

    if (error) {
      console.error('❌ Erro:', error)
      return
    }

    console.log('✅ Resposta completa da IA Coach:')
    console.log('-----------------------------------')
    console.log('Data:', JSON.stringify(data, null, 2))
    console.log('-----------------------------------')
    
    if (data && data.reply) {
      console.log('Resposta:', data.reply)
      // Verificar se NÃO está usando listas
      if (data.reply.includes('- ') || data.reply.includes('•')) {
        console.log('⚠️  ATENÇÃO: IA ainda usando listas!')
      } else {
        console.log('✅ SUCESSO: IA conversando naturalmente!')
      }
    } else if (data && data.response) {
      console.log('Resposta:', data.response)
      // Verificar se NÃO está usando listas
      if (data.response.includes('- ') || data.response.includes('•')) {
        console.log('⚠️  ATENÇÃO: IA ainda usando listas!')
      } else {
        console.log('✅ SUCESSO: IA conversando naturalmente!')
      }
    } else {
      console.log('❌ Resposta não encontrada ou formato inesperado')
    }
    
  } catch (err) {
    console.error('❌ Erro no teste:', err)
  }
}

testNewIACoach()