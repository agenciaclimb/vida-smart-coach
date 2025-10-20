// 📅 COMPONENTE DE CHECK-INS DIÁRIOS INTEGRADO AO IA COACH
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Sun, Moon, CheckCircle, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useGamification } from '@/contexts/data/GamificationContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

const CheckinSystem = () => {
  const { user } = useAuth();
  const { addDailyActivity } = useGamification();
  const [checkins, setCheckins] = useState([]);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState('');

  // Buscar check-ins do usuário
  useEffect(() => {
    if (user?.id) {
      fetchCheckins();
    }
  }, [user?.id]);

  const fetchCheckins = async () => {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', user.id)
        .in('interaction_type', ['morning_checkin', 'night_checkin', 'manual_checkin'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setCheckins(data || []);

      // Verificar se já fez check-in hoje
      const today = new Date().toISOString().split('T')[0];
      const todayCheckins = data?.filter(checkin => 
        checkin.created_at.startsWith(today)
      );

      setTodayCheckin(todayCheckins?.[0] || null);
    } catch (error) {
      console.error('Erro ao buscar check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fazer check-in manual
  const handleManualCheckin = async () => {
    if (!checkinMessage.trim()) {
      toast.error('Digite uma mensagem para seu check-in!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Buscar estágio atual do usuário
      const { data: stageData } = await supabase
        .from('client_stages')
        .select('current_stage')
        .eq('user_id', user.id)
        .single();

      const currentStage = stageData?.current_stage || 'sdr';

      // Registrar check-in manual
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          user_id: user.id,
          interaction_type: 'manual_checkin',
          stage: currentStage,
          content: checkinMessage,
          ai_response: getCheckinResponse(checkinMessage, currentStage),
          metadata: {
            manual: true,
            checkin_length: checkinMessage.length,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar pontos por check-in manual (registra atividade diária)
      await addDailyActivity({
        type: 'emotional',
        name: 'Check-in manual',
        points: 20,
        description: 'Check-in realizado pelo usuário',
        metadata: {
          stage: currentStage,
          message_length: checkinMessage.length,
          checkin_type: 'manual'
        }
      });

      setTodayCheckin(data);
      setCheckins(prev => [data, ...prev]);
      setCheckinMessage('');
      toast.success('✅ Check-in realizado! +20 pontos');

      await fetchCheckins(); // Atualizar lista
    } catch (error) {
      console.error('Erro no check-in:', error);
      toast.error('Erro ao fazer check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gerar resposta da IA baseada no estágio
  const getCheckinResponse = (message, stage) => {
    const responses = {
      sdr: `Obrigado por compartilhar! Vejo que você está ${message.toLowerCase().includes('bem') ? 'bem' : 'se esforçando'}. Como posso ajudar você hoje?`,
      specialist: `Interessante reflexão! Baseado no que você compartilhou, vamos focar em suas áreas de desenvolvimento. Que área quer trabalhar mais hoje?`,
      seller: `Excelente atualização! Vejo progresso em sua jornada. Que tal definirmos metas específicas para hoje baseado no que você relatou?`,
      partner: `Que bom ter você aqui! Sua dedicação é inspiradora. Vamos juntos transformar os insights de hoje em ações concretas!`
    };

    return responses[stage] || responses.sdr;
  };

  // Determinar o horário atual e tipo de check-in sugerido
  const getCurrentCheckinType = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 12) {
      return { type: 'morning', icon: Sun, label: 'Check-in Matinal', color: 'yellow' };
    } else if (hour >= 18 && hour <= 23) {
      return { type: 'night', icon: Moon, label: 'Check-in Noturno', color: 'blue' };
    } else {
      return { type: 'general', icon: MessageCircle, label: 'Check-in Geral', color: 'gray' };
    }
  };

  const currentCheckinType = getCurrentCheckinType();
  const CheckinIcon = currentCheckinType.icon;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando check-ins...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Sistema de Check-ins Diários
          <Badge variant="outline" className="ml-2">
            IA Coach
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check-in de hoje */}
        {todayCheckin ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Check-in de hoje realizado!</span>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300">
                +20 pontos
              </Badge>
            </div>
            <p className="text-sm text-green-700 mb-2">
              <strong>Você disse:</strong> {todayCheckin.content}
            </p>
            <p className="text-sm text-green-600">
              <strong>IA Coach:</strong> {todayCheckin.ai_response}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckinIcon className={`w-5 h-5 text-${currentCheckinType.color}-500`} />
              <span className="font-medium">{currentCheckinType.label}</span>
              <Badge variant="outline">
                +20 pontos
              </Badge>
            </div>
            
            <Textarea
              placeholder="Como você está se sentindo hoje? Compartilhe seus progressos, desafios ou reflexões..."
              value={checkinMessage}
              onChange={(e) => setCheckinMessage(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            
            <Button 
              onClick={handleManualCheckin}
              disabled={isSubmitting || !checkinMessage.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fazendo Check-in...</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" />Fazer Check-in</>
              )}
            </Button>
          </div>
        )}

        {/* Histórico de check-ins */}
        {checkins.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Histórico de Check-ins
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checkins.slice(0, 5).map((checkin) => (
                <div 
                  key={checkin.id} 
                  className="bg-white border border-gray-200 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">
                      {new Date(checkin.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={
                        checkin.interaction_type === 'morning_checkin' ? 'text-yellow-700 border-yellow-300' :
                        checkin.interaction_type === 'night_checkin' ? 'text-blue-700 border-blue-300' :
                        'text-gray-700 border-gray-300'
                      }
                    >
                      {checkin.interaction_type === 'morning_checkin' ? '🌅 Manhã' :
                       checkin.interaction_type === 'night_checkin' ? '🌙 Noite' :
                       '📝 Manual'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {checkin.content.length > 100 
                      ? `${checkin.content.substring(0, 100)}...` 
                      : checkin.content
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dica do sistema */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="text-blue-700">
            💡 <strong>Dica:</strong> Faça check-ins regulares para ganhar pontos e ajudar o IA Coach a entender melhor sua jornada!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckinSystem;