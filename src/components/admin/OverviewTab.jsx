
import React from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Users, TrendingUp, DollarSign, Calendar, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '@/contexts/DataContext';
import { Loader2 } from 'lucide-react';

const StatCard = ({ icon, title, value, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="vida-smart-card p-6 rounded-2xl shadow-lg"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.div>
);

const OverviewTab = () => {
  const { clients, loading } = useData();

  if (loading) {
    return (
      <TabsContent value="overview" className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  const activeClients = clients.filter(c => c.plan && c.plan !== 'trial');
  const trialClients = clients.filter(c => !c.plan || c.plan === 'trial');
  
  const totalRevenue = activeClients.reduce((acc, client) => {
      if (client.plan === 'basic') return acc + 29.90;
      if (client.plan === 'premium') return acc + 49.90;
      if (client.plan === 'vip') return acc + 89.90;
      return acc;
  }, 0);

  const stats = {
    totalClients: clients.length,
    activeClients: activeClients.length,
    trialClients: trialClients.length,
    totalRevenue,
  };

  const monthlyGrowth = [
    { name: 'Mar', "Novos Usuários": 12 },
    { name: 'Abr', "Novos Usuários": 19 },
    { name: 'Mai', "Novos Usuários": 25 },
    { name: 'Jun', "Novos Usuários": 31 },
    { name: 'Jul', "Novos Usuários": 28 },
    { name: 'Ago', "Novos Usuários": 35 },
  ];

  return (
    <TabsContent value="overview" className="space-y-6 mt-6">
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="w-6 h-6 text-blue-500" />} 
          title="Total Clientes" 
          value={stats.totalClients} 
          description="Usuários registrados" 
          delay={0}
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-green-500" />} 
          title="Clientes Ativos" 
          value={stats.activeClients} 
          description="Planos pagos" 
          delay={0.1}
        />
        <StatCard 
          icon={<Calendar className="w-6 h-6 text-yellow-500" />} 
          title="Em Teste" 
          value={stats.trialClients} 
          description="Período gratuito" 
          delay={0.2}
        />
        <StatCard 
          icon={<DollarSign className="w-6 h-6 text-purple-500" />} 
          title="Receita Mensal" 
          value={`R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}`}
          description="Estimativa atual" 
          delay={0.3}
        />
      </div>
      <div className="grid md:grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="vida-smart-card p-6 rounded-2xl shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Crescimento de Usuários
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGrowth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false}/>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                  }}
                  cursor={{ fill: 'rgba(0, 128, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Novos Usuários" fill="#38b000" barSize={30} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </TabsContent>
  );
};

export default OverviewTab;
