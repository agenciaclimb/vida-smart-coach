import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabaseClient';

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
