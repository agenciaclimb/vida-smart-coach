import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  globalThis.__supabase_singleton ??
  (globalThis.__supabase_singleton = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'vida-smart-auth',
    },
  }));

globalThis.__supabase_boots = (globalThis.__supabase_boots ?? 0) + 1;
console.info('BOOT: criando supabase client', globalThis.__supabase_boots);
