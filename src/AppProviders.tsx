import { useMemo } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseAnon) {
    console.error(
      '[ENV] Faltam variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. ' +
        'Configure-as no Vercel (Production/Preview).'
    );
  }

  const supabase: SupabaseClient = useMemo(
    () => createClient(supabaseUrl, supabaseAnon),
    [supabaseUrl, supabaseAnon]
  );

  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}

