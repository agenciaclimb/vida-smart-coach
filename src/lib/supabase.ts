/** DO NOT import legacy modules. See src/legacy/ for deprecated variants. */

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

export const supabase = getSupabase();

export default supabase;
