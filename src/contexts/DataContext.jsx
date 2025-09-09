
import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AdminProvider, useAdmin } from '@/contexts/data/AdminContext';
import { ClientProvider, useClient } from '@/contexts/data/ClientContext';
import { PartnerProvider, usePartner } from '@/contexts/data/PartnerContext';
import { CommunityProvider, useCommunity } from '@/contexts/data/CommunityContext';
import { IntegrationsProvider, useIntegrations } from '@/contexts/data/IntegrationsContext';
import { PlansRewardsProvider, usePlansRewards } from '@/contexts/data/PlansRewardsContext';
import { ChatProvider, useChat } from '@/contexts/data/ChatContext';
import { supabase } from '@/core/supabase';

const DataContext = createContext(undefined);

const CombinedDataProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  
  const adminData = useAdmin();
  const clientData = useClient();
  const partnerData = usePartner();
  const communityData = useCommunity();
  const integrationsData = useIntegrations();
  const plansRewardsData = usePlansRewards();
  const chatData = useChat();

  const isAdmin = useMemo(() => user?.profile?.role === 'admin', [user?.profile?.role]);
  const isPartner = useMemo(() => user?.profile?.role === 'partner', [user?.profile?.role]);
  const isClient = useMemo(() => user?.profile?.role === 'client', [user?.profile?.role]);

  useEffect(() => {
    if (!authLoading && user) {
      plansRewardsData.fetchData();
      if (isAdmin) {
        adminData.fetchData();
      }
    }
  }, [authLoading, user, isAdmin, plansRewardsData, adminData]);

  const loading = useMemo(() => {
    if (authLoading) return true;
    if (!user) return false;
    
    if (isAdmin) {
      return adminData.loading || plansRewardsData.loading;
    }
    if (isPartner) {
      return partnerData.loading || plansRewardsData.loading;
    }
    if (isClient) {
      return clientData.loading || communityData.loadingCommunity || integrationsData.loading || chatData.loading || plansRewardsData.loading;
    }
    
    return plansRewardsData.loading;
  }, [
    authLoading, user, isAdmin, isPartner, isClient,
    adminData.loading, clientData.loading, partnerData.loading,
    communityData.loadingCommunity, integrationsData.loading,
    plansRewardsData.loading, chatData.loading
  ]);

  const refetchData = useCallback(() => {
    plansRewardsData.fetchData();

    if (isAdmin) {
      adminData.fetchData();
    }
    if (isClient && user?.id) {
      clientData.refetchData(user.id);
      communityData.refetchCommunityData();
      integrationsData.refetchIntegrations();
    }
    if (isPartner && user?.id) {
      partnerData.refetchPartnerData(user.id);
    }
  }, [
    user, isAdmin, isClient, isPartner,
    adminData, clientData, partnerData, communityData, integrationsData, plansRewardsData
  ]);
  
  const value = useMemo(() => {
    const baseValue = {
      loading,
      refetchData,
      plans: plansRewardsData.plans,
      rewards: plansRewardsData.rewards,
      user,
      supabase,
    };

    if (isAdmin) {
      Object.assign(baseValue, adminData);
    }
    if (isClient) {
      Object.assign(baseValue, clientData, communityData, integrationsData, chatData);
    }
    if (isPartner) {
      Object.assign(baseValue, partnerData);
    }
    
    return baseValue;
  }, [
    loading, refetchData, plansRewardsData, user,
    isAdmin, adminData,
    isClient, clientData, communityData, integrationsData, chatData,
    isPartner, partnerData
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const DataProvider = ({ children }) => (
  <PlansRewardsProvider>
    <AdminProvider>
      <ClientProvider>
        <PartnerProvider>
          <CommunityProvider>
            <IntegrationsProvider>
              <ChatProvider>
                <CombinedDataProvider>
                  {children}
                </CombinedDataProvider>
              </ChatProvider>
            </IntegrationsProvider>
          </CommunityProvider>
        </PartnerProvider>
      </ClientProvider>
    </AdminProvider>
  </PlansRewardsProvider>
);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
