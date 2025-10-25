
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useChat } from '@/contexts/data/ChatContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation } from 'react-router-dom';

const ChatTab = () => {
    const { messages, sendMessage, loading: chatLoading } = useChat();
    const { user } = useAuth();
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);
    const location = useLocation();
    const autoMessageSentRef = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Enviar mensagem automática se vier do feedback
    useEffect(() => {
        const autoMessage = location.state?.autoMessage;
        if (autoMessage && user?.profile && !autoMessageSentRef.current) {
            autoMessageSentRef.current = true;
            sendMessage(autoMessage, user.profile);
        }
    }, [location.state, user, sendMessage]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() && user?.profile) {
            await sendMessage(inputMessage, user.profile);
            setInputMessage('');
        }
    };

    return (
        <TabsContent value="chat" className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="h-[calc(100vh-200px)] flex flex-col"
            >
                <Card className="flex flex-col flex-grow shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-vida-smart-gradient text-white py-4">
                        <CardTitle className="text-xl flex items-center">
                            <Bot className="mr-2" /> Sua IA Coach
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 overflow-hidden">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                {messages.length === 0 && !chatLoading && (
                                    <div className="text-center text-gray-500 py-10">
                                        <p>Comece uma conversa com sua IA Coach!</p>
                                        <p>Ela está pronta para te ajudar.</p>
                                    </div>
                                )}
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                                                msg.role === 'user'
                                                    ? 'bg-blue-500 text-white chat-bubble-user'
                                                    : 'bg-gray-200 text-gray-800 chat-bubble-ai'
                                            }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[70%] p-3 rounded-lg shadow-md bg-gray-200 text-gray-800 chat-bubble-ai flex items-center">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            <p className="text-sm">Digitando...</p>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-4 border-t bg-gray-50">
                        <form onSubmit={handleSendMessage} className="flex w-full space-x-2" data-tour="ia-chat">
                            <Input
                                type="text"
                                placeholder="Digite sua mensagem..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="flex-grow"
                                disabled={chatLoading}
                            />
                            <Button type="submit" disabled={!inputMessage.trim() || chatLoading}>
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </motion.div>
        </TabsContent>
    );
};

export default ChatTab;
