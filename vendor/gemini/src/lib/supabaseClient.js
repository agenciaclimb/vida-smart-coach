import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration!', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

export const supabase =
  globalThis.__supabase_singleton ??
  (globalThis.__supabase_singleton = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'vida-smart-auth'
    },
    global: {
      headers: {
        'X-Client-Info': 'vida-smart-coach@1.0.1'
      }
    },
    db: {
      schema: 'public'
    }
  }));

globalThis.__supabase_boots = (globalThis.__supabase_boots ?? 0) + 1;
console.info('BOOT: criando supabase client', globalThis.__supabase_boots);

// Test connection immediately
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('🔍 Initial Session Check:', { 
        hasSession: !!data?.session, 
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('❌ Session Check Failed:', e.message);
    }
  }, 100);
}