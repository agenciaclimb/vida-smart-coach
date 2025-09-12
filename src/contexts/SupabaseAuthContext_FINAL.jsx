// src/contexts/SupabaseAuthContext_FINAL.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getSupabase } from '../lib/supabase-singleton';

// ===============================================
// 🛡️ CONTEXT DE AUTH COM TIMEOUT E PROTEÇÕES
// ===============================================

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  resetPassword: () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();
  
  // Proteger contra múltiplas subscriptions em StrictMode
  const subRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // 🛡️ TIMEOUT DE SEGURANÇA - 8 segundos máximo
    const safety = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('session timeout')), 8000)
    );

    // Bootstrap inicial com timeout
    Promise.race([supabase.auth.getSession(), safety])
      .then((res) => {
        if (!mountedRef.current) return;
        const session = res?.data?.session ?? null;
        setUser(session?.user ?? null);
        console.log('✅ Auth bootstrap:', session?.user ? 'Authenticated' : 'Anonymous');
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        console.log('⚠️ Auth timeout/error:', error.message);
        setUser(null);
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    // 🛡️ ÚNICA SUBSCRIPTION - protegida contra duplicação
    if (!subRef.current) {
      subRef.current = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mountedRef.current) return;
        setUser(session?.user ?? null);
        console.log('🔄 Auth state change:', session?.user ? 'Signed In' : 'Signed Out');
      });
    }

    return () => {
      mountedRef.current = false;
      if (subRef.current?.data?.subscription?.unsubscribe) {
        subRef.current.data.subscription.unsubscribe();
        subRef.current = null;
      }
    };
  }, []);

  // Métodos de autenticação
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('❌ Reset password error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};