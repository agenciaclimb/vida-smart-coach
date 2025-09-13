import { supabase } from '@/lib/supabaseClient';

export async function edgeFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const headers = new Headers(init.headers || {});
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  const base = import.meta.env.VITE_SUPABASE_URL!.replace(/\/$/, '');
  return fetch(`${base}/functions/v1/${path}`, { ...init, headers });
}

