import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, BarChart3, Dumbbell, Zap, MessageSquare, Users, Edit, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useApiCallSafeGuard } from '@/hooks/useApiCall-SafeGuard';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProgressChart from '@/components/client/ProgressChart';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { getSupabase } from '@/lib/supabase-singleton';

// ===============================================
// 🛡️ SAFEGUARD DASHBOARD TAB - SEM LOOPS INFINITOS
// ===============================================

const StatCard = ({ icon, title, value, gradient, onClick }) => (
  <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
    <Card className="overflow-hidden" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardHeader className={`p-4 flex flex-row items-center justify-between space-y-0 pb-2 ${gradient}`}>
        <div className="flex items-center">
          <div className="p-2 bg-white/20 rounded-md mr-4">
            {icon}
          </div>
          <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  </motion.div>
);

const SafeGuardDailyCheckInCard = () => {
  const { user } = useAuth();
  const [weight, setWeight] = useState(user?.profile?.current_weight || '');
  const [mood, setMood] = useState('');
  const [sleep, setSleep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ PROTEÇÃO: Verificar check-in do dia com SafeGuard
  const { call: todayCheckInCall, abortAll: abortTodayCheckIn } = useApiCallSafeGuard();
  const [todayCheckInState, setTodayCheckInState] = useState({
    loading: true,
    data: null,
    error: null,
    retryCount: 0
  });

  const fetchTodayCheckIn = useCallback(async () => {
    if (!user?.id) {
      setTodayCheckInState({
        loading: false,
        data: null,
        error: null,
        retryCount: 0
      });
      return;
    }

    setTodayCheckInState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const today = new Date().toISOString().split('T')[0];

      const result = await todayCheckInCall(async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('daily_metrics')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new Error('Erro ao verificar check-in: ' + error.message);
        }

        return data ?? null;
      }, { maxRetries: 1, timeout: 8000, enabled: true });

      setTodayCheckInState({
        loading: false,
        data: result ?? null,
        error: null,
        retryCount: 0
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao verificar check-in';

      if (message === 'API call too frequent') {
        setTimeout(() => fetchTodayCheckIn(), 600);
        return;
      }

      console.error('❌ Erro ao verificar check-in:', error);
      setTodayCheckInState(prev => ({
        ...prev,
        loading: false,
        error: message,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [todayCheckInCall, user?.id]);

  useEffect(() => {
    fetchTodayCheckIn();
    return () => {
      abortTodayCheckIn();
    };
  }, [fetchTodayCheckIn, abortTodayCheckIn]);

  const todayCheckInAPI = useMemo(() => ({
    ...todayCheckInState,
    refetch: fetchTodayCheckIn,
    abort: abortTodayCheckIn
  }), [todayCheckInState, fetchTodayCheckIn, abortTodayCheckIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mood || !sleep) {
      toast.error("Por favor, preencha seu humor e sono.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔄 Salvando check-in diário...');
      
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('daily_metrics')
        .insert({
          user_id: user.id,
          weight: parseFloat(weight) || null,
          mood_score: parseInt(mood),
          sleep_hours: parseFloat(sleep),
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Check-in registrado com sucesso!");
      
      // Forçar refresh do check-in respeitando o debounce do SafeGuard
      setTimeout(() => fetchTodayCheckIn(), 600);
      
      // Limpar formulário
      setMood('');
      setSleep('');
      
    } catch (error) {
      console.error('❌ Erro no check-in:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao registrar check-in: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se ainda carregando
  if (todayCheckInAPI.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-500" />
            Verificando check-in do dia...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-3" />
            <span>Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se erro
  if (todayCheckInAPI.error) {
    return (
      <Card className="bg-red-50 border border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Erro ao Verificar Check-in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{todayCheckInAPI.error}</p>
          <Button 
            onClick={todayCheckInAPI.refetch}
            variant="outline" 
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se já fez check-in
  if (todayCheckInAPI.data) {
    return (
      <Card className="bg-lime-50 border border-lime-200">
        <CardHeader>
          <CardTitle className="text-lime-800 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Check-in do Dia Completo! ✅
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lime-700 mb-2">
            Ótimo trabalho por registrar seu progresso hoje. Continue assim e até amanhã!
          </p>
          <div className="text-sm text-lime-600">
            <p>• Peso: {todayCheckInAPI.data.weight ? `${todayCheckInAPI.data.weight} kg` : 'Não informado'}</p>
            <p>• Humor: {todayCheckInAPI.data.mood_score}/5</p>
            <p>• Sono: {todayCheckInAPI.data.sleep_hours}h</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formulário de check-in
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-500" />
          Check-in Diário Rápido (SafeGuard)
        </CardTitle>
        <CardDescription>
          Registre seu progresso em menos de 30 segundos com proteção anti-loop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="weight" className="text-sm font-medium text-gray-700 mb-1 block">
                Peso (kg)
              </label>
              <Input 
                id="weight" 
                type="number" 
                step="0.1" 
                placeholder="Ex: 75.5" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="mood" className="text-sm font-medium text-gray-700 mb-1 block">
                Humor hoje
              </label>
              <Select onValueChange={setMood} value={mood}>
                <SelectTrigger id="mood">
                  <SelectValue placeholder="Como se sente?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">😁 Excelente</SelectItem>
                  <SelectItem value="4">🙂 Bom</SelectItem>
                  <SelectItem value="3">😐 Normal</SelectItem>
                  <SelectItem value="2">😟 Ruim</SelectItem>
                  <SelectItem value="1">😩 Péssimo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="sleep" className="text-sm font-medium text-gray-700 mb-1 block">
                Sono (horas)
              </label>
              <Input 
                id="sleep" 
                type="number" 
                step="0.5" 
                placeholder="Ex: 8" 
                value={sleep} 
                onChange={(e) => setSleep(e.target.value)} 
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full vida-smart-gradient" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Check-in'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const SafeGuardUserStats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 🛡️ PROTEÇÃO: Buscar stats do usuário com SafeGuard
  const { call: userStatsCall, abortAll: abortUserStats } = useApiCallSafeGuard();
  const [userStatsState, setUserStatsState] = useState({
    loading: true,
    data: null,
    error: null,
    retryCount: 0
  });

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) {
      setUserStatsState({
        loading: false,
        data: null,
        error: null,
        retryCount: 0
      });
      return;
    }

    setUserStatsState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const result = await userStatsCall(async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw new Error('Erro ao carregar perfil: ' + error.message);
        }

        return data ?? null;
      }, { maxRetries: 2, timeout: 10000, enabled: true });

      setUserStatsState({
        loading: false,
        data: result ?? null,
        error: null,
        retryCount: 0
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar perfil';

      if (message === 'API call too frequent') {
        setTimeout(() => fetchUserStats(), 600);
        return;
      }

      console.error('❌ Erro ao carregar perfil:', error);
      setUserStatsState(prev => ({
        ...prev,
        loading: false,
        error: message,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [userStatsCall, user?.id]);

  useEffect(() => {
    fetchUserStats();
    return () => {
      abortUserStats();
    };
  }, [fetchUserStats, abortUserStats]);

  const userStatsAPI = useMemo(() => ({
    ...userStatsState,
    refetch: fetchUserStats,
    abort: abortUserStats
  }), [userStatsState, fetchUserStats, abortUserStats]);

  if (userStatsAPI.loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (userStatsAPI.error) {
    return (
      <Card className="bg-red-50 border border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800">❌ Erro ao Carregar Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{userStatsAPI.error}</p>
          <Button 
            onClick={userStatsAPI.refetch}
            variant="outline" 
            size="sm"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const profile = userStatsAPI.data || {};

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        icon={<Dumbbell className="text-white" />} 
        title="Plano Atual" 
        value={profile.plan || 'N/A'} 
        gradient="bg-gradient-to-tr from-blue-500 to-blue-400" 
        onClick={() => navigate('/dashboard?tab=plan')} 
      />
      <StatCard 
        icon={<Award className="text-white" />} 
        title="Nível" 
        value={profile.level || '1'} 
        gradient="bg-gradient-to-tr from-amber-500 to-amber-400" 
      />
      <StatCard 
        icon={<Zap className="text-white" />} 
        title="Pontos" 
        value={profile.points || '0'} 
        gradient="bg-gradient-to-tr from-lime-500 to-lime-400" 
        onClick={() => navigate('/dashboard?tab=gamification')} 
      />
      <StatCard 
        icon={<BarChart3 className="text-white" />} 
        title="Peso Atual" 
        value={`${profile.current_weight || '--'} kg`} 
        gradient="bg-gradient-to-tr from-violet-500 to-violet-400" 
      />
    </div>
  );
};

const DashboardTabSafeGuard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuário não encontrado</h3>
          <Button onClick={() => navigate('/login')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header com proteção */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-500" />
            Olá, {user.profile?.name || user.email?.split('@')[0] || 'Cliente'}!
          </h1>
          <p className="text-gray-500 mt-1">
            🛡️ Dashboard com proteção anti-loop. Bem-vindo(a) de volta!
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard?tab=profile')}>
          <Edit className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
      </div>

      {/* Stats com SafeGuard */}
      <SafeGuardUserStats />

      {/* Check-in com SafeGuard */}
      <SafeGuardDailyCheckInCard />

      {/* Progress Chart */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Seu Progresso
            </CardTitle>
            <CardDescription>
              Acompanhe sua evolução nas últimas semanas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard?tab=plan')}>
          <CardHeader className="flex-row items-center gap-4">
            <Dumbbell className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Meu Plano</CardTitle>
              <CardDescription>Treinos e hábitos</CardDescription>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard?tab=chat')}>
          <CardHeader className="flex-row items-center gap-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Falar com a IA</CardTitle>
              <CardDescription>Seu coach 24/7</CardDescription>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard?tab=community')}>
          <CardHeader className="flex-row items-center gap-4">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Comunidade</CardTitle>
              <CardDescription>Interaja e motive-se</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Debug info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">🔧 SafeGuard Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-500">
              {JSON.stringify({
                userId: user?.id,
                userEmail: user?.email,
                hasProfile: !!user?.profile
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default DashboardTabSafeGuard;
