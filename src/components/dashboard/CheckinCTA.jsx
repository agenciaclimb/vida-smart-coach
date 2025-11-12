import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, CheckCircle2, Sparkles, Flame, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * CheckinCTA - Call-to-Action principal do dashboard para check-in diário
 * 
 * @param {boolean} hasCheckedInToday - Se usuário já fez check-in hoje
 * @param {Function} onSubmit - Callback ao submeter check-in
 * @param {boolean} isSubmitting - Estado de loading
 * @param {Object} defaultValues - Valores padrão para os campos
 */
const CheckinCTA = ({ 
  hasCheckedInToday = false, 
  onSubmit, 
  isSubmitting = false,
  defaultValues = {}
}) => {
  const [weight, setWeight] = useState(defaultValues.weight || '');
  const [mood, setMood] = useState(defaultValues.mood || '');
  const [sleep, setSleep] = useState(defaultValues.sleep || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!mood || !sleep) {
      toast.error('Por favor, preencha pelo menos humor e sono!');
      return;
    }

    const metric = {
      weight: weight && Number.parseFloat(weight) > 0 ? Number.parseFloat(weight) : null,
      mood_score: mood ? Number.parseInt(mood, 10) : null,
      sleep_hours: sleep ? Number.parseFloat(sleep) : null
    };

    try {
      await onSubmit?.(metric);
      
      // Feedback visual com vibração
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
      
      // Limpar apenas mood e sleep (peso mantém)
      setMood('');
      setSleep('');
    } catch (error) {
      console.error('Error submitting checkin:', error);
    }
  };

  // Mensagens de incentivo baseadas no estado
  const getIncentiveMessage = () => {
    if (hasCheckedInToday) {
      return "Volte amanhã para continuar sua sequência! 🔥";
    }
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia! Comece o dia com o pé direito! ☀️";
    if (hour < 18) return "Boa tarde! Que tal fazer seu check-in agora? 🌤️";
    return "Boa noite! Não esqueça seu check-in antes de dormir! 🌙";
  };

  return (
    <Card className={`border-2 shadow-lg transition-all duration-300 ${
      hasCheckedInToday 
        ? 'border-green-500 bg-green-50/50' 
        : 'border-primary hover:shadow-xl'
    }`}>
      <CardHeader className={`${
        hasCheckedInToday 
          ? 'bg-green-100/50' 
          : 'bg-gradient-to-r from-primary/10 via-purple-50 to-pink-50'
      }`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className={`w-6 h-6 ${
              hasCheckedInToday ? 'text-green-600' : 'text-primary'
            }`} />
            Check-in Diário
          </CardTitle>
          
          {hasCheckedInToday ? (
            <Badge className="bg-green-600 text-white flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Concluído!
            </Badge>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Badge variant="outline" className="border-amber-500 text-amber-700 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                +10 XP
              </Badge>
            </motion.div>
          )}
        </div>
        
        <CardDescription className="text-base">
          {getIncentiveMessage()}
        </CardDescription>
      </CardHeader>
      
      <AnimatePresence mode="wait">
        {hasCheckedInToday ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            aria-live="polite"
          >
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Parabéns! 🎉
                </h3>
                <p className="text-gray-600 mb-4">
                  Check-in de hoje completado com sucesso!
                </p>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-amber-800">+10 XP ganhos</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-800">Sequência mantida</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSubmitting}>
                {/* Campos do formulário - Layout Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Peso */}
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium flex items-center gap-1">
                      ⚖️ Peso (kg)
                      <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      placeholder="Ex: 70.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="text-lg"
                      disabled={isSubmitting}
                      aria-label="Peso em quilogramas"
                    />
                  </div>

                  {/* Humor */}
                  <div className="space-y-2">
                    <Label htmlFor="mood" className="text-sm font-medium flex items-center gap-1">
                      😊 Humor (1-5)
                      <span className="text-xs text-red-500 font-normal">*</span>
                    </Label>
                    <Input
                      id="mood"
                      type="number"
                      min="1"
                      max="5"
                      placeholder="1 = 😢, 5 = 😄"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="text-lg"
                      disabled={isSubmitting}
                      required
                      aria-label="Humor de 1 a 5"
                      autoFocus
                    />
                  </div>

                  {/* Sono */}
                  <div className="space-y-2">
                    <Label htmlFor="sleep" className="text-sm font-medium flex items-center gap-1">
                      😴 Sono (horas)
                      <span className="text-xs text-red-500 font-normal">*</span>
                    </Label>
                    <Input
                      id="sleep"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="Ex: 8"
                      value={sleep}
                      onChange={(e) => setSleep(e.target.value)}
                      className="text-lg"
                      disabled={isSubmitting}
                      required
                      aria-label="Horas de sono"
                    />
                  </div>
                </div>

                {/* Dica rápida */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Dica:</strong> Fazer check-ins diários ajuda a identificar padrões 
                      e a IA pode dar sugestões mais personalizadas!
                    </span>
                  </p>
                </div>

                {/* Botão de Submit */}
                <Button 
                  type="submit"
                  className="w-full vida-smart-gradient text-white text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                      </motion.div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Registrar Check-in e Ganhar 10 XP
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default CheckinCTA;
