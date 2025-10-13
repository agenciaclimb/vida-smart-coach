import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
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

    const sendMessage = useCallback(async (content, userProfile) => {
        if (!user?.id) {
            toast.error('Você precisa estar logado para conversar com a IA.');
            return;
        }

        const userMessage = {
            role: 'user',
            content,
            user_id: user.id,
            created_at: new Date().toISOString(),
        };

        addMessage(userMessage);
        setLoading(true);

        try {
            // Persiste a mensagem do usuário no banco
            const { error: userMessageError } = await supabase.from('conversations').insert(userMessage);
            if (userMessageError) throw userMessageError;

            // Invoca a IA Coach via Supabase Edge Function
            const { data: aiResponse, error: functionError } = await supabase.functions.invoke('ia-coach-chat', {
                body: { 
                    messageContent: content,
                    userProfile: userProfile,
                    chatHistory: messages.slice(-5) // Envia as últimas 5 mensagens como contexto
                },
            });

            if (functionError) throw functionError;

            const aiMessage = {
                role: 'assistant',
                content: aiResponse.reply,
                user_id: user.id,
                created_at: new Date().toISOString(),
            };

            addMessage(aiMessage);

            // Persiste a resposta da IA no banco
            const { error: aiMessageError } = await supabase.from('conversations').insert(aiMessage);
            if (aiMessageError) throw aiMessageError;

        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(`Erro ao enviar mensagem: ${error.message}`);
            // Opcional: remover a mensagem do usuário da UI se a chamada falhar
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    }, [user, messages, addMessage]);

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
        sendMessage,
        fetchMessages,
        refetchMessages,
        addMessage,
    }), [messages, loading, sendMessage, fetchMessages, refetchMessages, addMessage]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
