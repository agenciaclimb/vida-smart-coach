import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSupabase } from '../lib/supabase-singleton';

// ===============================================
// 🔐 SUPABASE AUTH CONTEXT - VIDA SMART FINAL
// ===============================================
// Versão blindada contra timeout e loops

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
  const [initialized, setInitialized] = useState(false);
  
  // Refs para evitar memory leaks
  const mountedRef = useRef(true);
  const subscriptionRef = useRef(null);
  const safetyTimerRef = useRef(null);

  // Obter cliente singleton
  const supabase = getSupabase();

  // ===============================================
  // 🛡️ FUNÇÃO DE SEGURANÇA - FORCE STOP LOADING
  // ===============================================
  const forceStopLoading = (reason = 'timeout') => {
    if (!mountedRef.current) return;
    
    console.log(`⏰ Force stop loading - Reason: ${reason}`);
    setUser(null);
    setLoading(false);
    setInitialized(true);
  };

  // ===============================================
  // 🚀 INICIALIZAÇÃO COM TIMEOUT HARD STOP
  // ===============================================
  useEffect(() => {
    console.log('🚀 Auth inicializando com proteção de timeout...');
    
    mountedRef.current = true;

    // Safety timer - NUNCA deixa loading infinito
    safetyTimerRef.current = setTimeout(() => {
      forceStopLoading('safety-timeout');
    }, 8000); // 8 segundos máximo

    // ===============================================
    // 📱 OBTER SESSÃO INICIAL
    // ===============================================
    const initializeSession = async () => {
      try {
        console.log('🔍 Verificando sessão inicial...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mountedRef.current) return;

        // Limpar safety timer se chegou até aqui
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }

        if (error) {
          console.warn('⚠️ Erro ao obter sessão inicial:', error.message);
          setUser(null);
        } else if (session?.user) {
          console.log('✅ Sessão inicial encontrada:', session.user.email);
          setUser(session.user);
        } else {
          console.log('ℹ️ Nenhuma sessão inicial encontrada');
          setUser(null);
        }

        setLoading(false);
        setInitialized(true);

      } catch (err) {
        if (!mountedRef.current) return;
        
        console.error('❌ Erro crítico na inicialização:', err);
        
        // Limpar safety timer
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }
        
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    };

    // ===============================================
    // 👂 LISTENER DE MUDANÇAS DE AUTH (ÚNICO)
    // ===============================================
    const setupAuthListener = () => {
      console.log('👂 Configurando listener de auth...');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mountedRef.current) return;

          console.log(`🔄 Auth event: ${event}`, session?.user?.email || 'no-user');

          // Timeout para processar mudanças (evita race conditions)
          setTimeout(() => {
            if (!mountedRef.current) return;

            switch (event) {
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
                if (session?.user) {
                  setUser(prevUser => {
                    // Só atualizar se realmente mudou
                    return prevUser?.id !== session.user.id ? session.user : prevUser;
                  });
                }
                break;
                
              case 'SIGNED_OUT':
                console.log('🚪 Usuário deslogado');
                setUser(null);
                break;
                
              default:
                console.log('ℹ️ Auth event não tratado:', event);
            }
          }, 100);
        }
      );

      subscriptionRef.current = subscription;
      return subscription;
    };

    // Executar inicialização
    initializeSession();
    setupAuthListener();

    // ===============================================
    // 🧹 CLEANUP
    // ===============================================
    return () => {
      console.log('🧹 Cleanup do AuthProvider...');
      
      mountedRef.current = false;
      
      // Limpar timers
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      
      // Limpar subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []); // Executar apenas uma vez

  // ===============================================
  // 🔑 FUNÇÃO DE LOGIN
  // ===============================================
  const signIn = async (email, password) => {
    try {
      console.log('🔐 Tentando login...', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        return { data: null, error };
      }

      console.log('✅ Login bem-sucedido');
      return { data, error: null };
      
    } catch (err) {
      console.error('❌ Erro crítico no login:', err);
      return { 
        data: null, 
        error: { message: 'Erro inesperado no login' }
      };
    }
  };

  // ===============================================
  // 🚪 FUNÇÃO DE LOGOUT
  // ===============================================
  const signOut = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('⚠️ Erro no logout:', error.message);
      } else {
        console.log('✅ Logout realizado com sucesso');
      }
      
      // Sempre limpar o estado local, mesmo com erro
      setUser(null);
      
    } catch (err) {
      console.error('❌ Erro crítico no logout:', err);
      // Forçar limpeza local mesmo com erro
      setUser(null);
    }
  };

  // ===============================================
  // 📋 CONTEXT VALUE
  // ===============================================
  const contextValue = {
    // Estado
    user,
    loading,
    initialized,
    
    // Funções
    signIn,
    signOut,
    
    // Utilitários para debugging
    supabase,
    forceStopLoading: () => forceStopLoading('manual')
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};