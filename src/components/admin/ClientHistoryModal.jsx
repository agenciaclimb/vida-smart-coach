import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Bot, User, Clock, Activity, Loader2, MessageSquare as MessageSquareOff, Send } from 'lucide-react';
import { supabase } from '../../core/supabase';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const ClientHistoryModal = ({ client, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef(null);

  const fetchHistory = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setHistory(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico de conversas:", error);
      toast.error("Não foi possível carregar o histórico.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && client?.id) {
      fetchHistory(client.id);
    }
  }, [isOpen, client, fetchHistory]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !client?.phone || !client?.id) {
      toast.error("A mensagem não pode estar vazia.");
      return;
    }

    setIsSending(true);
    try {
      const { error: sendError } = await supabase.functions.invoke('whatsapp-send', {
        body: JSON.stringify({ phone: client.phone, message: newMessage }),
      });
      if (sendError) throw new Error(`Falha ao invocar a função de envio: ${sendError.message}`);

      const sentMessage = {
        role: 'assistant',
        content: newMessage,
        created_at: new Date().toISOString(),
      };
      
      const { error: saveError } = await supabase.from('conversations').insert({
        user_id: client.id,
        role: 'assistant',
        content: newMessage,
      });

      if (saveError) {
         toast.error(`Mensagem enviada, mas falhou ao salvar no histórico: ${saveError.message}`);
         console.error("Erro ao salvar mensagem:", saveError);
      } else {
         toast.success("Mensagem enviada e salva com sucesso!");
         setHistory(prev => [...prev, sentMessage]);
      }
      
      setNewMessage('');
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(`Falha ao enviar mensagem: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };


  if (!client) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!history || history.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-48 text-center">
          <MessageSquareOff className="w-12 h-12 text-gray-400 mb-2" />
          <p className="font-semibold text-gray-700">Nenhuma conversa encontrada</p>
          <p className="text-sm text-gray-500">Este cliente ainda não iniciou uma conversa com a IA Coach.</p>
        </div>
      );
    }

    return (
      <div ref={scrollAreaRef} className="max-h-[400px] overflow-y-auto pr-4 space-y-4">
        {history.map((item, index) => {
          const isUser = item.role === 'user';
          const isAssistant = item.role === 'assistant';

          if (!isUser && !isAssistant) return null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-3 ${isUser ? 'justify-end' : ''}`}
            >
              {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  <Bot size={16} />
                </div>
              )}
              <div className={`p-3 rounded-lg max-w-sm ${isUser ? 'bg-blue-50 text-right ml-auto' : 'bg-green-50'}`}>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
                {item.created_at && (
                  <p className="text-xs text-gray-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                )}
              </div>
              {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <User size={16} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle>Histórico de {client.full_name}</DialogTitle>
          <DialogDescription>
            Acompanhe as interações e atividades do cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 my-4 text-sm">
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Activity className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold">Última Atividade</p>
              <p className="text-gray-600">{new Date(client.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-semibold">Cliente Desde</p>
              <p className="text-gray-600">{new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        {renderContent()}
        <div className="flex items-center space-x-2 mt-4">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isSending) {
                handleSendMessage();
              }
            }}
            disabled={isSending}
          />
          <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
