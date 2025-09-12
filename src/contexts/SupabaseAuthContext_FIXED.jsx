import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect inicial com timeout de segurança "hard stop"
  useEffect(() => {
    console.log('🚀 Auth com timeout de segurança...');
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (!mounted) return;
      console.log('⏰ Timeout ativado - parando loading');
      setUser(null);            // <- garante estado coerente
      setLoading(false);        // <- impede tela branca
    }, 8000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        clearTimeout(safetyTimer);
        setUser(session?.user || null);
        setLoading(false);
        console.log('✅ Sessão OK:', !!session);
      })
      .catch((err) => {
        if (!mounted) return;
        clearTimeout(safetyTimer);
        console.warn('❌ getSession falhou:', err?.message || err);
        setUser(null);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const next = session?.user || null;
      setUser((prev) => (prev?.id === next?.id ? prev : next));
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Função de login
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { data: null, error };
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};