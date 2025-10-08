import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = import.meta.env.VITE_SUPABASE_URL
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anon) {
    console.error('[Supabase] VITE_SUPABASE_URL/ANON_KEY ausentes')
    // devolve um objeto falso pra evitar crash (o Provider já lida com isso)
    return null
  }
  
  client = createClient(url, anon, { 
    auth: { 
      persistSession: true, 
      autoRefreshToken: true 
    } 
  })
  return client
}