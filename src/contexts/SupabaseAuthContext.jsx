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
        .from('profiles')
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
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/account-upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          fullName: metadata?.full_name,
          phone: metadata?.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        return { 
          user: null, 
          error: { 
            message: result.error || 'Signup failed',
            code: result.code || 'signup_error'
          } 
        };
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error after signup:', sessionError);
      }

      return { 
        user: { id: result.userId, email: result.email }, 
        error: null 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        user: null, 
        error: { 
          message: error.message || 'Network error during signup',
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

  const updateUserProfile = useCallback(async (profileData) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
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
