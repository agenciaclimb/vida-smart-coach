import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true });

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
        setSession(s ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  const user = session?.user ?? null;
  const value = useMemo(() => ({ session, user, loading }), [session, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
