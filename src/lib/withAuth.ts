import { getSupabase } from '@/lib/supabase-singleton';

export async function withAuth<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e: any) {
    if (String(e?.message || '').includes('JWT expired')) {
      const { data, error } = await getSupabase().auth.refreshSession();
      if (!error && data?.session) return await fn();
    }
    throw e;
  }
}