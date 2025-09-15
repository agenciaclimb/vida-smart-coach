import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// Demo mode for testing - set to true to enable
const DEMO_MODE = true;

type EnrichedUser = User & { profile?: any };

type AuthCtx = {
  session: Session | null;
  user: EnrichedUser | null;
  loading: boolean;
  supabase: typeof supabase;
  signOut: () => Promise<void>;
  updateUserProfile: (profileData: any) => Promise<any>;
};

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, supabase, signOut: async () => {}, updateUserProfile: async () => {} });

// Demo user for testing - define outside component to avoid recreating
const demoUser = DEMO_MODE ? {
  id: '00000000-0000-0000-0000-000000000001', // Valid UUID format
  email: 'demo@vidasmart.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  profile: {
    id: '00000000-0000-0000-0000-000000000001', // Valid UUID format
    full_name: 'Usuário Demo',
    name: 'Demo',
    email: 'demo@vidasmart.com',
    height: 175,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
} as EnrichedUser : null;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!DEMO_MODE); // If demo mode, start not loading
  const [user, setUser] = useState<EnrichedUser | null>(DEMO_MODE ? demoUser : null); // Initialize with demo user if demo mode

  // Sessão + listener
  useEffect(() => {
    if (DEMO_MODE) {
      console.log('🧪 DEMO MODE: Demo user already initialized');
      return; // Demo user already set in initial state
    }

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
    if (DEMO_MODE) {
      // Demo mode já tem usuário configurado
      return;
    }

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
    if (DEMO_MODE) {
      console.log('🧪 DEMO MODE: Sign out simulated');
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const updateUserProfile = async (profileData: any) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      console.log('Updating profile for user:', user.id, profileData);
      
      if (DEMO_MODE) {
        // Demo mode: simulate profile update
        console.log('🧪 DEMO MODE: Simulating profile update');
        const updatedProfile = {
          ...user.profile,
          ...profileData,
          updated_at: new Date().toISOString()
        };
        
        setUser(prevUser => prevUser ? { ...prevUser, profile: updatedProfile } : prevUser);
        console.log('✅ DEMO: Profile updated successfully');
        return updatedProfile;
      }
      
      // Map incoming data to available columns only
      const allowedData = {
        id: user.id,
        full_name: profileData.full_name || profileData.name || null,
        name: profileData.name || profileData.full_name || null,
        email: user.email || profileData.email || null,
        height: profileData.height || null,
        updated_at: new Date().toISOString()
      };

      console.log('Mapped profile data:', allowedData);
      
      // Tenta fazer upsert (INSERT ou UPDATE)
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(allowedData)
        .select()
        .single();

      if (error) {
        console.error("Profile upsert error:", error);
        throw error;
      } else {
        console.log("Profile updated successfully:", data);
        // Update the user state with new profile
        setUser(prevUser => prevUser ? { ...prevUser, profile: data } : prevUser);
        return data;
      }
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const value = useMemo(() => ({ session, user, loading, supabase, signOut, updateUserProfile }), [session, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // fallback defensivo
    return { user: null, session: null, loading: true, supabase, signOut: async () => {}, updateUserProfile: async () => {} } as any;
  }
  return ctx;
}
