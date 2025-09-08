import { useMemo } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  // Vite usa VITE_* no client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const supabase: SupabaseClient = useMemo(() => {
    if (!supabaseUrl || !supabaseAnon) {
      console.warn('Supabase envs ausentes: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
    }
    return createClient(supabaseUrl, supabaseAnon);
  }, [supabaseUrl, supabaseAnon]);

  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}

