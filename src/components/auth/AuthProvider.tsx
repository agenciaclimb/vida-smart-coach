import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { normalizeActivityLevel } from '@/domain/profile/activityLevels';
import { normalizeGoalType } from '@/domain/profile/goalTypes';

// Demo mode for testing - set to true to enable
const DEMO_MODE = false; // Disabled to test real database

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
      
      // Use the new safe upsert function to prevent type mismatch errors
      console.log('Using safe_upsert_user_profile function with validated data');
      
      // BLINDAGEM CRÍTICA: Normalizar e validar antes de enviar ao banco
      const activityLevel = normalizeActivityLevel(profileData.activity_level);
      const goalType = normalizeGoalType(profileData.goal_type);
      
      // Validar que temos slugs válidos ou rejeitar
      if (profileData.activity_level && !activityLevel) {
        throw new Error('Nível de atividade inválido. Recarregue a página e tente novamente.');
      }
      
      if (profileData.goal_type && !goalType) {
        throw new Error('Objetivo inválido. Recarregue a página e tente novamente.');
      }
      
      const validatedData = {
        p_user_id: user.id,
        p_full_name: profileData.full_name?.toString().trim() || null,
        p_name: profileData.name?.toString().trim() || profileData.full_name?.toString().trim() || null,
        p_email: user.email || profileData.email?.toString().trim() || null,
        p_phone: profileData.phone?.toString().trim() || null,
        p_age: profileData.age ? parseInt(profileData.age.toString()) : null,
        p_height: profileData.height ? parseInt(profileData.height.toString()) : null,
        p_current_weight: profileData.current_weight ? parseFloat(profileData.current_weight.toString()) : null,
        p_target_weight: profileData.target_weight ? parseFloat(profileData.target_weight.toString()) : null,
        p_gender: profileData.gender?.toString() || null,
        p_activity_level: activityLevel, // SEMPRE slug válido ou null
        p_goal_type: goalType, // SEMPRE slug válido ou null
        p_wants_reminders: profileData.wants_reminders !== undefined ? Boolean(profileData.wants_reminders) : null,
        p_wants_quotes: profileData.wants_quotes !== undefined ? Boolean(profileData.wants_quotes) : null
      };

      console.log('Validated profile data:', validatedData);
      
      // Call the safe upsert function
      const { data, error } = await supabase.rpc('safe_upsert_user_profile', validatedData);

      if (error) {
        console.error('Safe upsert function error:', error);
        // Fallback to traditional upsert if function doesn't exist yet
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('Function not available, falling back to direct upsert');
          
          const fallbackData = {
            id: user.id,
            full_name: validatedData.p_full_name,
            name: validatedData.p_name,
            email: validatedData.p_email,
            phone: validatedData.p_phone,
            age: validatedData.p_age,
            height: validatedData.p_height,
            current_weight: validatedData.p_current_weight,
            target_weight: validatedData.p_target_weight,
            gender: validatedData.p_gender,
            activity_level: activityLevel, // JÁ normalizado e validado acima
            goal_type: goalType, // JÁ normalizado e validado acima
            wants_reminders: validatedData.p_wants_reminders,
            wants_quotes: validatedData.p_wants_quotes,
            updated_at: new Date().toISOString()
          };
          
          // LOG para debug - verificar payload final
          console.log('🔍 Fallback payload:', {
            activity_level: fallbackData.activity_level,
            goal_type: fallbackData.goal_type
          });
          
          const { data: fallbackResult, error: fallbackError } = await supabase
            .from('user_profiles')
            .upsert(fallbackData)
            .select()
            .single();
            
          if (fallbackError) {
            throw fallbackError;
          }
          
          console.log('Profile updated successfully with fallback method:', fallbackResult);
          setUser(prevUser => prevUser ? { ...prevUser, profile: fallbackResult } : prevUser);
          return fallbackResult;
        }
        throw error;
      }
      
      console.log('Profile updated successfully with safe function:', data);
      setUser(prevUser => prevUser ? { ...prevUser, profile: data } : prevUser);
      return data;
      
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({ session, user, loading, supabase, signOut, updateUserProfile }), [session, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // fallback defensivo
    return { user: null, session: null, loading: true, supabase, signOut: async () => {}, updateUserProfile: async () => {} } as any;
  }
  return ctx;
}
