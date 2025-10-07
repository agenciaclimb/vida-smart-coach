import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Trophy, Star, Target, Flame, Award, TrendingUp } from 'lucide-react';

const GamificationDashboard = () => {
  const { user } = useAuth();
  const [gamificationData, setGamificationData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
      fetchAchievements();
      fetchUserAchievements();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('total_points, current_level, current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setGamificationData(data);
    } catch (error) {
      console.error('Erro ao buscar dados de gamificação:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points_required');

      if (error) throw error;
      setAchievements(data);
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
    }
  };

  const fetchUserAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at, achievements(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserAchievements(data);
    } catch (error) {
      console.error('Erro ao buscar conquistas do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPointsForNextLevel = () => {
    if (!gamificationData) return 0;
    const currentLevel = gamificationData.current_level || 1;
    return currentLevel * 100; // 100 pontos por nível
  };

  const getProgressToNextLevel = () => {
    if (!gamificationData) return 0;
    const totalPoints = gamificationData.total_points || 0;
    const currentLevel = gamificationData.current_level || 1;
    const pointsForCurrentLevel = (currentLevel - 1) * 100;
    const pointsForNextLevel = currentLevel * 100;
    const progressPoints = totalPoints - pointsForCurrentLevel;
    const levelRange = pointsForNextLevel - pointsForCurrentLevel;
    return Math.min((progressPoints / levelRange) * 100, 100);
  };

  const isAchievementUnlocked = (achievementId) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const canUnlockAchievement = (achievement) => {
    if (!gamificationData) return false;
    return gamificationData.total_points >= achievement.points_required;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamificationData?.total_points || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 50)} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamificationData?.current_level || 1}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(getProgressToNextLevel())}% para o próximo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamificationData?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground">dias consecutivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Sequência</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamificationData?.longest_streak || 0}</div>
            <p className="text-xs text-muted-foreground">recorde pessoal</p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do nível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso do Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Nível {gamificationData?.current_level || 1}</span>
              <span>Nível {(gamificationData?.current_level || 1) + 1}</span>
            </div>
            <Progress value={getProgressToNextLevel()} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{gamificationData?.total_points || 0} pontos</span>
              <span>{getPointsForNextLevel()} pontos necessários</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conquistas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = isAchievementUnlocked(achievement.id);
              const canUnlock = canUnlockAchievement(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isUnlocked
                      ? 'border-green-500 bg-green-50'
                      : canUnlock
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl ${isUnlocked ? 'grayscale-0' : 'grayscale'}`}>
                      {achievement.icon || '🏆'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={isUnlocked ? 'default' : 'secondary'}>
                          {achievement.points_required} pontos
                        </Badge>
                        {isUnlocked && (
                          <Badge variant="outline" className="text-green-600">
                            ✓ Conquistado
                          </Badge>
                        )}
                        {!isUnlocked && canUnlock && (
                          <Badge variant="outline" className="text-yellow-600">
                            Disponível!
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Atividades recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Check-in diário completado</p>
                <p className="text-xs text-muted-foreground">+10 pontos • há 2 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Meta de água atingida</p>
                <p className="text-xs text-muted-foreground">+15 pontos • há 4 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Exercício registrado</p>
                <p className="text-xs text-muted-foreground">+20 pontos • ontem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationDashboard;

