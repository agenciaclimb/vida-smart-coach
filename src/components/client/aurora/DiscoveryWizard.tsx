import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { featureFlags } from '@/config/featureFlags';

type DiscoveryWizardProps = {
  onCreateGoal?: () => void;
};

const DiscoveryWizard = ({ onCreateGoal }: DiscoveryWizardProps) => {
  if (!featureFlags.auroraV1) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>DiscoveryWizard (prévia)</CardTitle>
        <CardDescription>
          Fluxo guiado para entender valores, metas e próximos passos do cliente. Em desenvolvimento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-gray-600">
        <ol className="list-decimal list-inside space-y-2">
          <li>Capte os valores essenciais do cliente e defina pesos.</li>
          <li>Transforme valores em metas trimestrais com marcos claros.</li>
          <li>Planeje micro-passos da próxima semana alinhados às metas.</li>
          <li>Registre possíveis bloqueios e responda com nudges via IA Coach.</li>
        </ol>
        <div className="pt-2">
          <Button onClick={onCreateGoal}>Iniciar jornada Aurora</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscoveryWizard;
