import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/core/supabase';
import toast from 'react-hot-toast';

const IACoach = () => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Olá! Eu sou a Vida, sua coach de IA. Estou aqui para te ajudar a dar o primeiro passo na sua jornada de bem-estar. Qual seu maior desafio hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('test-ia', {
        body: JSON.stringify({ message: input }),
      });

      if (error) throw error;
      
      if (data && data.reply) {
        const aiMessage = { sender: 'ai', text: data.reply };
        setMessages(prev => [...prev, aiMessage]);
      } else {
         throw new Error(data.error || "Resposta da IA inválida.");
      }
    } catch (error) {
      console.error("Error calling test-ia function:", error);
      const friendlyErrorMsg = { sender: 'ai', text: "Oops! A Coach Vida está tirando um cochilo. Tente novamente em instantes." };
      setMessages(prev => [...prev, friendlyErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="ia-coach" className="py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Converse com sua Coach de Saúde</h2>
            <p className="text-lg text-gray-600">
              Experimente agora. Tire uma dúvida e veja como nossa IA pode te ajudar a desbloquear seu potencial.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 sm:p-4 flex flex-col h-[500px]">
            <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
              <div className="space-y-6 p-4">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-primary/10 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-gray-100 text-gray-700 rounded-bl-lg'}`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                       {msg.sender === 'user' && (
                        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-lime-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-lime-700" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                 {isLoading && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-full flex-shrink-0 bg-primary/10 flex items-center justify-center">
                         <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                      <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 rounded-bl-lg">
                        <p className="text-sm italic">digitando...</p>
                      </div>
                    </motion.div>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-4 p-4 border-t border-gray-100">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua dúvida aqui..."
                className="flex-grow bg-slate-50 rounded-full focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="rounded-full w-10 h-10 vida-smart-gradient" disabled={isLoading || !input.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IACoach;
