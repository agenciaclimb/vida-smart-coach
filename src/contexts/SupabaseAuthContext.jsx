import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/core/supabase';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            const profile = await fetchUserProfile(currentSession.user);
            if (isMounted) {
              setUser({ ...currentSession.user, profile, access_token: currentSession.access_token });
            }
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.error("Error in initial session/profile fetch:", e);
        if(e.message.includes('Failed to fetch')) {
          toast.error("Não foi possível conectar ao servidor. Verifique sua conexão.", { id: 'initial-load-network-error' });
        } else {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Verificar se é um erro real ou apenas confirmação pendente
        if (error.message?.includes('User already registered') || 
            error.message?.includes('already been registered')) {
          return { success: false, error: 'Este email já está cadastrado. Tente fazer login.' };
        }
        return { success: false, error: error.message };
      }

      // CORREÇÃO PRINCIPAL: Verificar se o usuário foi criado com sucesso
      if (data?.user) {
        // Se o usuário foi criado mas não está confirmado
        if (!data.user.email_confirmed_at) {
          return { 
            success: true, 
            needsConfirmation: true,
            message: 'Conta criada com sucesso! Verifique seu email para confirmar o cadastro.',
            user: data.user 
          };
        }
        
        // Se o usuário foi criado e já está confirmado
        return { 
          success: true, 
          needsConfirmation: false,
          message: 'Conta criada e confirmada com sucesso!',
          user: data.user 
        };
      }

      // Fallback - se chegou até aqui, algo inesperado aconteceu
      return { 
        success: false, 
        error: 'Erro inesperado durante o cadastro. Tente novamente.' 
      };

    } catch (error) {
      console.error('Erro no signup:', error);
      return { 
        success: false, 
        error: 'Erro de conexão. Verifique sua internet e tente novamente.' 
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
    supabase
  }), [user, session, loading, refetchUser, signUp, signIn, signOut, updateUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
