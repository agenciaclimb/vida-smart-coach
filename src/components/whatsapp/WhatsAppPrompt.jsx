import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WhatsAppPrompt - Componente reutilizável para incentivar uso do WhatsApp
 * @param {string} trigger - Contexto do prompt: 'first_plan' | 'third_completion' | 'chat_tab'
 * @param {function} onDismiss - Callback quando usuário fecha o prompt
 * @param {function} onConnect - Callback quando usuário clica em conectar
 */
const WhatsAppPrompt = ({ trigger, onDismiss, onConnect, show = true }) => {
  const messages = {
    first_plan: {
      title: '🎉 Plano criado com sucesso!',
      description: 'Que tal receber lembretes e dicas diárias no WhatsApp? Sua IA coach pode te acompanhar de perto!',
      cta: 'Conectar WhatsApp',
    },
    third_completion: {
      title: '🔥 Você está indo bem!',
      description: 'Continue firme! Conecte seu WhatsApp para receber motivação e nunca perder o ritmo.',
      cta: 'Ativar no WhatsApp',
    },
    chat_tab: {
      title: '💬 Converse pelo WhatsApp',
      description: 'Sabia que você pode falar com a IA Coach direto do WhatsApp? Muito mais prático no dia a dia!',
      cta: 'Usar WhatsApp',
    },
  };

  const content = messages[trigger] || messages.chat_tab;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="pt-6 pb-4 relative">
              <button
                onClick={onDismiss}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500 rounded-full">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{content.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{content.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={onConnect}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {content.cta}
                    </Button>
                    <Button onClick={onDismiss} variant="ghost" size="sm">
                      Depois
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppPrompt;
