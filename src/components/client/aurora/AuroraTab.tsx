import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { featureFlags } from '@/config/featureFlags';
import { useAurora } from '@/contexts/data/AuroraContext';

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-sm text-gray-600">
    <span>{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export const AuroraTab = () => {
  const { enabled, loading, error, goals, milestones, actions, reviews, values, refresh } = useAurora();

  if (!featureFlags.auroraV1 || !enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aurora (em breve)</CardTitle>
          <CardDescription>O módulo Aurora ainda não está habilitado para este ambiente.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aurora</CardTitle>
          <CardDescription>Carregando dados do plano estratégico...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aurora</CardTitle>
          <CardDescription>Falha ao carregar dados: {error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={refresh}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter((goal) => goal.status === 'active').length;
  const completedMilestones = milestones.filter((milestone) => milestone.status === 'completed').length;
  const completedActions = actions.filter((action) => action.status === 'done').length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Vida</CardTitle>
          <CardDescription>Valores, metas e marcos associados à jornada do cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Valores declarados" value={values.length} />
          <InfoRow label="Metas ativas" value={activeGoals} />
          <InfoRow label="Marcos cadastrados" value={milestones.length} />
          <InfoRow label="Marcos concluídos" value={completedMilestones} />
          <div className="pt-4">
            <Button onClick={refresh} variant="outline">Atualizar dados</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ritual Semanal</CardTitle>
          <CardDescription>Micro-passos concluídos e revisões registradas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Micro-passos concluídos" value={completedActions} />
          <InfoRow label="Revisões registradas" value={reviews.length} />
          {reviews.length > 0 ? (
            <InfoRow
              label="Última revisão"
              value={new Date(reviews[0].created_at as string).toLocaleDateString('pt-BR')}
            />
          ) : (
            <InfoRow label="Última revisão" value="Nenhuma revisão registrada" />
          )}
          <p className="text-xs text-gray-500">
            Use o DiscoveryWizard para capturar novos valores e metas quando conversar com o cliente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuroraTab;
