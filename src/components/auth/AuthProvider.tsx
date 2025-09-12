import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase-singleton';

const AuthCtx = createContext<any>(null);
export function useAuth() { return useContext(AuthCtx); }

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const safety = setTimeout(() => {
      if (mounted) {
        console.log('⏰ Auth boot timeout — seguindo sem sessão');
        setUser(null);
        setLoading(false);
      }
    }, 8000);

    getSupabase().auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        clearTimeout(safety);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        clearTimeout(safety);
        setUser(null);
        setLoading(false);
      });

    const { data: sub } = getSupabase().auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}