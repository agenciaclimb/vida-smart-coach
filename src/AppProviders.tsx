import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
// @ts-ignore - types may not expose this helper
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-react';

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
