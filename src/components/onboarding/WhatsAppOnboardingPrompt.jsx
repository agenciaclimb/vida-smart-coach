import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

const WHATSAPP_PROMPT_DISMISSED = 'vida_smart_whatsapp_prompt_dismissed';
const WHATSAPP_NUMBER = '5511934025008'; // Número oficial Vida Smart Coach

const WhatsAppOnboardingPrompt = ({ onDismiss }) => {
  const { user } = useAuth();
  const [hasWhatsAppInteraction, setHasWhatsAppInteraction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkWhatsAppUsage() {
      try {
        if (!user?.id) {
          setLoading(false);
          return;
        }

        // Check localStorage for manual dismissal
        const manualDismiss = localStorage.getItem(WHATSAPP_PROMPT_DISMISSED);
        if (manualDismiss) {
          setDismissed(true);
          setLoading(false);
          return;
        }

        // Check if user has already sent WhatsApp messages
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('id', { count: 'exact', head: true })
          .or(`user_phone.eq.${user?.profile?.phone},phone.eq.${user?.profile?.phone}`)
          .limit(1);

        if (!cancelled) {
          if (error) {
            console.warn('Error checking WhatsApp messages:', error);
          } else if (data || (await supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).limit(1)).data) {
            setHasWhatsAppInteraction(true);
            setDismissed(true);
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('WhatsApp check failed:', e);
          setLoading(false);
        }
      }
    }

    checkWhatsAppUsage();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.profile?.phone]);

  const handleDismiss = () => {
    localStorage.setItem(WHATSAPP_PROMPT_DISMISSED, 'true');
    setDismissed(true);
    onDismiss?.();
  };

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Acabei de gerar meu plano na plataforma Vida Smart e quero começar a usar a IA Coach pelo WhatsApp. 🚀`
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    // Mark as interacted (optimistic)
    handleDismiss();
  };

  if (loading || dismissed || hasWhatsAppInteraction) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500 rounded-full">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-emerald-900">Use a IA Coach no WhatsApp! 📱</CardTitle>
            </div>
            <CardDescription className="text-emerald-700">
              A verdadeira transformação acontece no seu dia a dia. Conecte-se com a IA pelo WhatsApp e tenha seu coach sempre à mão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <p className="text-sm text-emerald-900">Receba lembretes e dicas ao longo do dia</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <p className="text-sm text-emerald-900">Tire dúvidas e ajuste seu plano a qualquer momento</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <p className="text-sm text-emerald-900">Reporte atividades rapidamente e ganhe pontos</p>
              </div>
            </div>
            <Button
              onClick={handleOpenWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Abrir WhatsApp e Começar
            </Button>
            <p className="text-xs text-center text-emerald-700">
              Salve o número e envie a primeira mensagem para ativar a IA Coach
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default WhatsAppOnboardingPrompt;
