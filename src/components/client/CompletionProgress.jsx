import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCompletionStats } from '@/hooks/useCompletionStats';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const formatDate = (dateStr) => format(new Date(dateStr), 'dd/MM', { locale: ptBR });

const CompletionTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-sm">
      <div className="font-medium mb-1">{formatDate(label)}</div>
      {payload.map((p, idx) => (
        <div key={idx} className="flex justify-between gap-4" style={{ color: p.fill || p.color }}>
          <span>{p.name}</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CompletionProgress = () => {
  const { user } = useAuth();
  const [range, setRange] = useState('7d');
  const { data, loading, summary } = useCompletionStats(user?.id, range);

  const hasData = summary && summary.totals && summary.totals.total > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Progresso de Conclusões</CardTitle>
            <CardDescription>Itens concluídos por dia e XP acumulado</CardDescription>
          </div>
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              <TabsTrigger value="7d">7 dias</TabsTrigger>
              <TabsTrigger value="30d">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="animate-spin w-6 h-6 mr-2" /> Carregando progresso...
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum progresso registrado ainda</h3>
            <p className="text-sm text-gray-500 max-w-md">
              Comece marcando itens como concluídos nos seus planos (Físico, Nutricional, Emocional ou Espiritual) 
              para visualizar seus gráficos de progresso aqui!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Total de Itens</div>
                <div className="text-2xl font-bold">{summary?.totals.total || 0}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">XP Ganhado</div>
                <div className="text-2xl font-bold text-green-600">{summary?.totals.xp || 0}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Melhor Dia</div>
                <div className="text-2xl font-bold">{summary?.bestDay?.date ? formatDate(summary.bestDay.date) : '-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-2">Itens concluídos por dia</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<CompletionTooltip />} />
                    <Legend />
                    <Bar dataKey="physical" name="Físico" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="nutritional" name="Nutricional" stackId="a" fill="#22c55e" />
                    <Bar dataKey="emotional" name="Emocional" stackId="a" fill="#ef4444" />
                    <Bar dataKey="spiritual" name="Espiritual" stackId="a" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">XP acumulado por dia</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<CompletionTooltip />} />
                    <Area type="monotone" dataKey="xp" name="XP" stroke="#16a34a" fillOpacity={1} fill="url(#xpGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletionProgress;
