import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para refresh da sessão
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('🔄 Tentando refresh da sessão...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('❌ Falha no refresh:', error?.message);
        await signOut();
        return false;
      }
      
      console.log('✅ Sessão refreshed com sucesso');
      setUser(data.session.user);
      return true;
    } catch (error) {
      console.error('❌ Erro crítico no refresh:', error);
      await signOut();
      return false;
    }
  };

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando login...');
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        throw error;
      }

      if (data.session) {
        console.log('✅ Login bem-sucedido:', data.session.user.id);
        setUser(data.session.user);
        return { data, error: null };
      }

      throw new Error('Nenhuma sessão retornada');
    } catch (error) {
      console.error('❌ Erro no signIn:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('⚠️ Erro no logout:', error.message);
      }
      
      setUser(null);
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro crítico no logout:', error);
      setUser(null);
    }
  };

  // Inicialização e listeners
  useEffect(() => {
    let mounted = true;

    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando Auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error.message);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session && mounted) {
          console.log('✅ Sessão inicial encontrada:', session.user.id);
          setUser(session.user);
        } else {
          console.log('ℹ️ Nenhuma sessão inicial encontrada');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state change:', event, session?.user?.id || 'no-user');

        try {
          switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                setUser(session.user);
                console.log('✅ Usuário atualizado via event:', session.user.id);
              }
              break;
              
            case 'SIGNED_OUT':
              setUser(null);
              console.log('🚪 Usuário deslogado via event');
              
              // Redirecionar se não estiver na página de login
              if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                console.log('🔄 Redirecionando para login...');
                window.location.href = '/login';
              }
              break;
              
            default:
              console.log('ℹ️ Auth event não tratado:', event);
          }
        } catch (error) {
          console.error('❌ Erro no listener de auth:', error);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signOut,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};