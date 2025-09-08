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
    const getSessionAndProfile = async () => {
      try {
        console.log('Boot: session-start');
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('session timeout')), 6000)
        );
        
        const { data: { session: currentSession }, error: sessionError } = await Promise.race([
          sessionPromise, 
          timeoutPromise
        ]);
        
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            console.log('Boot: session-ok');
            const profile = await fetchUserProfile(currentSession.user);
            if (isMounted) {
              setUser({ ...currentSession.user, profile, access_token: currentSession.access_token });
            }
          } else {
            console.log('Boot: session-none');
            setUser(null);
          }
        }
      } catch (e) {
        console.warn("Boot: session-timeout/error", e.message);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
        if(e.message.includes('Failed to fetch')) {
          toast.error("Não foi possível conectar ao servidor. Verifique sua conexão.", { id: 'initial-load-network-error' });
        } else if (!e.message.includes('timeout')) {
          toast.error("Erro ao carregar a sessão.", { id: 'initial-load-error' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: metadata?.full_name,
            whatsapp: metadata?.phone 
          },
          emailRedirectTo: `${origin}/`
        }
      });

      if (error) {
        return { 
          user: null, 
          error: { 
            message: error.message,
            code: error.status || 'signup_error'
          } 
        };
      }

      if (!data.session) {
        return {
          user: data.user,
          error: null,
          needsEmailConfirmation: true
        };
      }

      return { 
        user: data.user, 
        session: data.session,
        error: null 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        user: null, 
        error: { 
          message: error.message || 'Erro inesperado durante o cadastro',
          code: 'network_error'
        } 
      };
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, session: data.session, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate('/login', { replace: true });
  }, [navigate]);

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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
