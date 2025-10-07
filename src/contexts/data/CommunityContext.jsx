
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/core/supabase';

const CommunityContext = createContext(undefined);

export const CommunityProvider = ({ children }) => {
    const { user } = useAuth();
    const [ranking, setRanking] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [loadingCommunity, setLoadingCommunity] = useState(true);

    const fetchCommunityData = useCallback(async () => {
        if (!user) return;
        setLoadingCommunity(true);
        try {
            // Versão mínima e robusta: evita JOINs/aggregates que podem não existir no schema atual
            const [rankingRes, postsRes] = await Promise.all([
                supabase.from('user_profiles').select('id, name').limit(10),
                supabase.from('community_posts')
                  .select('id, content, created_at, likes, user_id')
                  .order('created_at', { ascending: false })
                  .limit(20)
            ]);

            const ranking = (rankingRes.data || []).map(r => ({ id: r.id, full_name: r.name || 'Usuário', points: 0 }));
            setRanking(ranking);
            setCommunityPosts(postsRes.data || []);

            if (rankingRes.error) console.warn('community ranking error:', rankingRes.error.message);
            if (postsRes.error) console.warn('community posts error:', postsRes.error.message);
        } catch (error) {
            console.error("Community data error:", error);
        } finally {
            setLoadingCommunity(false);
        }
    }, [user?.id]);

    const refetchCommunityData = useCallback(() => {
        fetchCommunityData();
    }, [fetchCommunityData]);
    
    useEffect(() => {
      if (user?.id) {
        fetchCommunityData();
      }
      // Chamar apenas quando o id mudar
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const value = useMemo(() => ({
        ranking,
        communityPosts,
        loadingCommunity,
        refetchCommunityData,
        fetchCommunityData,
    }), [ranking, communityPosts, loadingCommunity, refetchCommunityData, fetchCommunityData]);

    return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
};

export const useCommunity = () => {
    const context = useContext(CommunityContext);
    if (context === undefined) {
        throw new Error('useCommunity must be used within a CommunityProvider');
    }
    return context;
};
