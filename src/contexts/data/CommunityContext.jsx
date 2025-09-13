
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
            const [rankingRes, postsRes] = await Promise.all([
                supabase.from('user_profiles').select('id, full_name, points').order('points', { ascending: false }).limit(10),
                supabase.from('community_posts').select(`
                    id, content, created_at, likes, user_id,
                    profile:user_profiles!community_posts_user_id_fkey(full_name),
                    user_has_liked:post_likes(count)
                `)
                .eq('post_likes.user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20)
            ]);

            if (rankingRes.error) throw rankingRes.error;
            if (postsRes.error) throw postsRes.error;
            
            const processedPosts = postsRes.data.map(post => ({
                ...post,
                user_has_liked: post.user_has_liked[0]?.count > 0,
            }));

            setRanking(rankingRes.data || []);
            setCommunityPosts(processedPosts || []);

        } catch (error) {
            toast.error("Erro ao carregar dados da comunidade.");
            console.error("Community data error:", error);
        } finally {
            setLoadingCommunity(false);
        }
    }, [user]);

    const refetchCommunityData = useCallback(() => {
        fetchCommunityData();
    }, [fetchCommunityData]);
    
    useEffect(() => {
      if(user?.id) {
          fetchCommunityData();
      }
    }, [user, fetchCommunityData]);

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
