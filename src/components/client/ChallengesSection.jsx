// ChallengesSection.jsx - Componente dedicado para exibir desafios ativos
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, Target, Calendar, Clock, Zap, CheckCircle, RefreshCw,
  Flame, Award, TrendingUp, Users
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useChallenges } from '@/hooks/useChallenges';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ChallengesSection = () => {
  const { user } = useAuth();
  const { challenges, loading, updating, joinChallenge, updateProgress } = useChallenges(user?.id);
  const [joining, setJoining] = useState(null);
  const [refreshing, setRefreshing] = useState(null);

  const handleJoinChallenge = async (challengeId) => {
    setJoining(challengeId);
    await joinChallenge(challengeId);
    setJoining(null);
  };

  const handleRefreshProgress = async (challengeId) => {
    setRefreshing(challengeId);
    await updateProgress(challengeId);
    setRefreshing(null);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'weekly': return <Calendar className="w-5 h-5" />;
      case 'monthly': return <TrendingUp className="w-5 h-5" />;
      case 'seasonal': return <Award className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'weekly': return 'Desafio Semanal';
      case 'monthly': return 'Desafio Mensal';
      case 'seasonal': return 'Desafio Sazonal';
      default: return 'Desafio';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'weekly': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monthly': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'seasonal': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const hours = differenceInHours(end, now);
    const days = differenceInDays(end, now);

    if (days > 1) {
      return `${days} dias restantes`;
    } else if (hours > 1) {
      return `${hours} horas restantes`;
    } else {
      return 'Últimas horas!';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum desafio ativo no momento
          </h3>
          <p className="text-sm text-gray-500">
            Novos desafios são criados semanalmente e mensalmente. Fique de olho!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {challenges.map((challenge, index) => (
        <motion.div
          key={challenge.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className={`${challenge.is_participating && !challenge.is_completed ? 'border-primary border-2' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getCategoryColor(challenge.category)}>
                      {getCategoryIcon(challenge.category)}
                      <span className="ml-1">{getCategoryLabel(challenge.category)}</span>
                    </Badge>
                    {challenge.is_completed && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    {challenge.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {challenge.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recompensas */}
              <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Award className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Recompensas</p>
                  <p className="text-xs text-amber-700">
                    +{challenge.rewards?.xp || 0} XP
                    {challenge.bonus_multiplier > 1 && (
                      <span className="ml-2 inline-flex items-center">
                        <Zap className="w-3 h-3 mr-1" />
                        {challenge.bonus_multiplier}x multiplicador
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Progresso (apenas se estiver participando) */}
              {challenge.is_participating && !challenge.is_completed && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Seu Progresso</span>
                    <span className="text-gray-600">
                      {challenge.current_progress?.current || 0} / {challenge.requirements?.target || 100}
                    </span>
                  </div>
                  <Progress 
                    value={
                      ((challenge.current_progress?.current || 0) / 
                       (challenge.requirements?.target || 100)) * 100
                    } 
                    className="h-3" 
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {Math.round(((challenge.current_progress?.current || 0) / 
                                   (challenge.requirements?.target || 100)) * 100)}% completo
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRefreshProgress(challenge.id)}
                      disabled={refreshing === challenge.id}
                      className="h-6 px-2 text-xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshing === challenge.id ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Timer */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeRemaining(challenge.end_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(challenge.start_date), 'dd/MM', { locale: ptBR })} - {format(new Date(challenge.end_date), 'dd/MM', { locale: ptBR })}
                  </span>
                </div>
              </div>

              {/* Participantes */}
              {challenge.max_participants && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {challenge.current_participants || 0} / {challenge.max_participants} participantes
                  </span>
                </div>
              )}

              {/* Ação */}
              {!challenge.is_participating ? (
                <Button
                  onClick={() => handleJoinChallenge(challenge.event_id)}
                  disabled={joining === challenge.event_id || (challenge.max_participants && challenge.current_participants >= challenge.max_participants)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {joining === challenge.event_id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4 mr-2" />
                      Participar do Desafio
                    </>
                  )}
                </Button>
              ) : challenge.is_completed ? (
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Parabéns! Você completou este desafio!
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    +{challenge.points_earned || challenge.rewards?.xp || 0} XP ganhos
                  </p>
                </div>
              ) : (
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium flex items-center justify-center gap-2">
                    <Flame className="w-5 h-5" />
                    Você está participando!
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Continue progredindo para ganhar as recompensas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ChallengesSection;
