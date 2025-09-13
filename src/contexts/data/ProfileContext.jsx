
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userMetrics, setUserMetrics] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error.message);
      toast.error('Erro ao carregar perfil do usuário.');
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  const fetchUserMetrics = useCallback(async () => {
    if (!user) {
      setUserMetrics([]);
      setLoadingMetrics(false);
      return;
    }
    setLoadingMetrics(true);
    try {
      const { data, error } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      
      if (error) throw error;
      setUserMetrics(data || []);
    } catch (error) {
      console.error('Erro ao buscar métricas do usuário:', error.message);
      toast.error('Erro ao carregar métricas do usuário.');
      setUserMetrics([]);
    } finally {
      setLoadingMetrics(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserProfile();
      fetchUserMetrics();
    }
  }, [authLoading, user, fetchUserProfile, fetchUserMetrics]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loadingProfile,
        userMetrics,
        loadingMetrics,
        fetchUserProfile,
        fetchUserMetrics,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
