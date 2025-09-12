// src/lib/supabase-singleton.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = import.meta.env.VITE_SUPABASE_URL!;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;
  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
  });
  return _client;
}