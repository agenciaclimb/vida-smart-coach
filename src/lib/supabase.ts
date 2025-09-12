import { createClient } from '@supabase/supabase-js';

let _client = null as any;

export function getSupabase() {
  if (_client) return _client;
  
  _client = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    { 
      auth: { 
        autoRefreshToken: true, 
        persistSession: true, 
        detectSessionInUrl: false, 
        flowType: 'pkce' 
      } 
    }
  );
  
  return _client;
}

export default getSupabase();