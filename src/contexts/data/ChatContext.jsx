
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import { supabase } from '@/core/supabase';

const ChatContext = createContext(undefined);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async (userId) => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            toast.error("Erro ao carregar histórico de conversas.");
            console.error("Chat history fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const addMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const refetchMessages = useCallback(() => {
        if (user?.id) {
            fetchMessages(user.id);
        }
    }, [user, fetchMessages]);
    
    useEffect(() => {
        if (user?.id) {
            fetchMessages(user.id);
        }
    }, [user, fetchMessages]);

    const value = useMemo(() => ({
        messages,
        loading,
        fetchMessages,
        refetchMessages,
        addMessage,
    }), [messages, loading, fetchMessages, refetchMessages, addMessage]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
