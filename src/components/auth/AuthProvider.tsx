import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

type EnrichedUser = User & { profile?: any };

type AuthCtx = {
  session: Session | null;
  user: EnrichedUser | null;
  loading: boolean;
  supabase: typeof supabase;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, supabase, signOut: async () => {} });

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<EnrichedUser | null>(null);

  // Sessão + listener
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

  // Enriquecer com profile
  useEffect(() => {
    const u = session?.user ?? null;
    if (!u) {
      setUser(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();
        if (cancelled) return;
        const enriched: EnrichedUser = { ...(u as any) };
        if (data) enriched.profile = data;
        setUser(enriched);
        if (error) {
          // Mantém user básico mesmo sem profile
          setUser(enriched);
        }
      } catch {
        if (!cancelled) setUser(u as any);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value = useMemo(() => ({ session, user, loading, supabase, signOut }), [session, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // fallback defensivo
    return { user: null, session: null, loading: true, supabase, signOut: async () => {} } as any;
  }
  return ctx;
}
