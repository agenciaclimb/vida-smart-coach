import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, BarChart3, Dumbbell, Zap, MessageSquare, Users, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCheckins } from '@/contexts/data/CheckinsContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProgressChart from '@/components/client/ProgressChart';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import WelcomeCard from '@/components/client/WelcomeCard';

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

const DailyCheckInCard = () => {
  const { user } = useAuth();
  const { addDailyMetric, hasCheckedInToday, loadingCheckin } = useCheckins();
  const [weight, setWeight] = useState(user?.profile?.current_weight || '');
  const [mood, setMood] = useState('');
  const [sleep, setSleep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood || !sleep) {
      toast.error("Por favor, preencha seu humor e sono.");
      return;
    }
    setIsSubmitting(true);
    try {
      const metric = {
        weight: weight ? parseFloat(weight) : null,
        mood_score: parseInt(mood),
        sleep_hours: parseFloat(sleep)
      };
      const result = await addDailyMetric(metric);
      if (result?.success) {
        // Clear form on success
        setMood('');
        setSleep('');
        // Keep weight as it doesn't change daily
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(`Erro ao registrar check-in: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasCheckedInToday) {
    return (
      <Card className="bg-lime-50 border border-lime-200">
        <CardHeader>
          <CardTitle className="text-lime-800">Check-in do Dia Completo! ✅</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lime-700">Ótimo trabalho por registrar seu progresso hoje. Continue assim e até amanhã!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-in Diário Rápido</CardTitle>
        <CardDescription>Registre seu progresso em menos de 30 segundos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="weight" className="text-sm font-medium text-gray-700 mb-1 block">Peso (kg)</label>
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
              <label htmlFor="mood" className="text-sm font-medium text-gray-700 mb-1 block">Humor hoje</label>
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
              <label htmlFor="sleep" className="text-sm font-medium text-gray-700 mb-1 block">Sono (horas)</label>
              <Input id="sleep" type="number" step="0.5" placeholder="Ex: 8" value={sleep} onChange={(e) => setSleep(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full vida-smart-gradient" disabled={isSubmitting || loadingCheckin}>
            {isSubmitting || loadingCheckin ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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


const DashboardTab = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Exibe loading apenas enquanto a autenticação está carregando.
  // Se o perfil ainda não existir no banco, seguimos com valores padrão.
  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
  }
  
  const profile = user?.profile || {};
  
  // Check if profile is complete for conditional WelcomeCard display
  const hasCompleteProfile = profile?.name || profile?.full_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Show WelcomeCard if profile is incomplete */}
      {!hasCompleteProfile && <WelcomeCard />}
      
      {/* Show greeting if profile is complete */}
      {hasCompleteProfile && (
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Olá, {profile.name || profile.full_name || 'Cliente'}!</h1>
            <p className="text-gray-500 mt-1">Bem-vindo(a) de volta. Pronto para evoluir hoje?</p>
          </div>
          <Button onClick={() => navigate('/dashboard?tab=profile')}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Dumbbell className="text-white" />} 
          title="Plano Atual" 
          value={hasCompleteProfile ? (profile.plan || 'N/A') : 'Pendente'} 
          gradient={hasCompleteProfile ? "bg-gradient-to-tr from-blue-500 to-blue-400" : "bg-gradient-to-tr from-gray-400 to-gray-300"} 
          onClick={() => navigate('/dashboard?tab=plan')} 
        />
        <StatCard icon={<Award className="text-white" />} title="Nível" value={profile.level || '1'} gradient="bg-gradient-to-tr from-amber-500 to-amber-400" />
        <StatCard icon={<Zap className="text-white" />} title="Pontos" value={profile.points || '0'} gradient="bg-gradient-to-tr from-lime-500 to-lime-400" onClick={() => navigate('/dashboard?tab=gamification')} />
        <StatCard icon={<BarChart3 className="text-white" />} title="Peso Atual" value={`${profile.current_weight || '--'} kg`} gradient="bg-gradient-to-tr from-violet-500 to-violet-400" />
      </div>

      {/* Always show DailyCheckInCard */}
      <DailyCheckInCard />

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Seu Progresso</CardTitle>
            <CardDescription>Acompanhe sua evolução nas últimas semanas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>
      </div>

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
    </motion.div>
  );
};

export default DashboardTab;