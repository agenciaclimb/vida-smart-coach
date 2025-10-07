
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedLabel = format(new Date(label), 'dd MMM', { locale: ptBR });
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="label">{`${formattedLabel}`}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const ProgressChart = () => {
  const { userMetrics, loading } = useData();

  if (loading) {
    return <div>Carregando gráficos...</div>;
  }

  if (!userMetrics || userMetrics.length < 2) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Registre seus dados no check-in diário por pelo menos dois dias para ver seu progresso aqui!</p>
      </div>
    );
  }

  const chartData = userMetrics.map(metric => ({
    ...metric,
    date: metric.date, 
    mood: metric.mood_score,
  }));
  
  const formatDateTick = (tickItem) => {
    return format(new Date(tickItem), 'dd/MM', { locale: ptBR });
  };
  
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
       <Card>
          <CardHeader>
             <CardTitle>Evolução do Peso (kg)</CardTitle>
             <CardDescription>Acompanhe seu peso ao longo do tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDateTick} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="weight" name="Peso" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
       </Card>

        <Card>
            <CardHeader>
                <CardTitle>Humor e Sono</CardTitle>
                <CardDescription>Veja a correlação entre seu humor e suas horas de sono.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateTick} />
                    <YAxis yAxisId="left" orientation="left" stroke="#82ca9d" domain={[0, 6]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ffc658" domain={[0, 12]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="mood" name="Humor (1-5)" stroke="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="sleep_hours" name="Sono (horas)" stroke="#ffc658" />
                </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
};

export default ProgressChart;
