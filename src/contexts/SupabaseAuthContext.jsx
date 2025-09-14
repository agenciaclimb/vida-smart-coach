import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const supabase = useSupabaseClient();

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return profile || null;
    } catch (e) {
      if (e.message.toLowerCase().includes('failed to fetch')) {
        console.error("Network error while fetching profile:", e.message);
        toast.error("Falha de conexão ao buscar perfil.", { id: 'fetch-profile-network-error' });
      } else {
        console.error("Exception while fetching profile:", e);
        toast.error(`Ocorreu um erro ao buscar seu perfil: ${e.message}`, { id: 'profile-fetch-error' });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const getSessionAndProfile = async () => {
      try {
        console.log('Boot: session-start');
        
        // Timeout mais curto e com fallback
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('Boot: session-timeout, proceeding without session');
            setSession(null);
            setUser(null);
            setLoading(false);
          }
        }, 3000);
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        // Limpar timeout se chegou aqui
        clearTimeout(timeoutId);
        
        if (sessionError) {
          console.warn('Boot: session-error', sessionError.message);
        }

        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            console.log('Boot: session-ok');
            try {
              const profile = await fetchUserProfile(currentSession.user);
              if (isMounted) {
                setUser({ ...currentSession.user, profile, access_token: currentSession.access_token });
              }
            } catch (profileError) {
              console.warn('Boot: profile-fetch-error', profileError.message);
              // Continue without profile
              if (isMounted) {
                setUser({ ...currentSession.user, profile: null, access_token: currentSession.access_token });
              }
            }
          } else {
            console.log('Boot: session-none');
            setUser(null);
          }
          setLoading(false);
        }
      } catch (e) {
        console.warn("Boot: session-error", e.message);
        clearTimeout(timeoutId);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        // Não mostrar toast para timeouts simples
        if (e.message.includes('Failed to fetch')) {
          toast.error("Conexão instável. Tentando novamente...", { id: 'initial-load-network-error' });
        }
      }
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        if (newSession?.user) {
          const profile = await fetchUserProfile(newSession.user);
           if (isMounted) {
            setUser({ ...newSession.user, profile, access_token: newSession.access_token });
           }
        } else {
           if (isMounted) {
            setUser(null);
           }
        }
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);
  
  const signUp = useCallback(async (email, password, metadata) => {
    try {
      const origin = window.location.origin;
      console.log('SignUp attempt for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: metadata?.full_name,
            whatsapp: metadata?.phone || metadata?.whatsapp,
            role: metadata?.role || 'client'
          },
          emailRedirectTo: `${origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        return { 
          user: null, 
          error: { 
            message: error.message,
            code: error.status || 'signup_error'
          } 
        };
      }

      console.log('SignUp result:', { 
        user: data.user?.id, 
        session: !!data.session,
        confirmationSent: !data.session && data.user 
      });

      // Se não há sessão, significa que precisa confirmar email
      if (!data.session && data.user) {
        return {
          user: data.user,
          error: null,
          needsEmailConfirmation: true
        };
      }

      // Se há sessão, login foi automático
      if (data.session && data.user) {
        return { 
          user: data.user, 
          session: data.session,
          error: null 
        };
      }

      return {
        user: data.user,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('Signup network error:', error);
      return { 
        user: null, 
        error: { 
          message: error.message || 'Erro inesperado durante o cadastro',
          code: 'network_error'
        } 
      };
    }
  }, [supabase]);

  const signIn = useCallback(async (email, password) => {
    try {
      console.log('SignIn attempt for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('SignIn error:', error);
      } else if (data.user) {
        console.log('SignIn successful for user:', data.user.id);
      }
      
      return { user: data.user, session: data.session, error };
    } catch (error) {
      console.error('SignIn network error:', error);
      return { 
        user: null, 
        session: null, 
        error: { 
          message: error.message || 'Erro de conexão',
          code: 'network_error'
        }
      };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      console.log('SignOut initiated');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('SignOut error:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      navigate('/login', { replace: true });
    }
  }, [navigate, supabase]);

  const clearAppDataAndReload = useCallback(async () => {
    try {
      console.log('Boot: clearing-app-data');
      
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        console.log('Boot: caches-cleared');
      }
      
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => {
        localStorage.removeItem(k);
        console.log('Boot: localStorage-cleared', k);
      });
      
      sessionStorage.clear();
      console.log('Boot: sessionStorage-cleared');
      
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
        console.log('Boot: sw-unregistered');
      }
      
      toast.success('Dados locais limpos. Recarregando...', { id: 'clear-data-success' });
    } catch (e) {
      console.error('Boot: clear-data-error', e);
      toast.error('Erro ao limpar dados. Tentando recarregar...', { id: 'clear-data-error' });
    } finally {
      setTimeout(() => window.location.reload(), 1000);
    }
  }, []);

  const updateUserProfile = useCallback(async (profileData) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      toast.error("Falha ao atualizar o perfil.");
      console.error("Profile update error:", error);
    } else {
      toast.success("Perfil atualizado com sucesso!");
      setUser(prevUser => ({ ...prevUser, profile: data }));
    }
  }, [user]);
  
  const refetchUser = useCallback(async () => {
    if (!user) return;
    const profile = await fetchUserProfile(user);
    setUser(currentUser => ({ ...currentUser, profile }));
  }, [user, fetchUserProfile]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    refetchUser,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    clearAppDataAndReload,
    supabase
  }), [user, session, loading, refetchUser, signUp, signIn, signOut, updateUserProfile, clearAppDataAndReload]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('[legacy SupabaseAuthContext] useAuth fora do provider — fallback ativo');
    return { user: null, session: null, loading: true };
  }
  return context;
};
