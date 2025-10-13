import React from 'react';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { usePlansRewards } from '../../contexts/data/PlansRewardsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

// Define the Plan interface based on context
interface Plan {
  id: number | string;
  name: string;
  price: number;
  description?: string | null;
}

export const PaymentRequiredModal = () => {
  const { isExpired, isLoading } = useTrialStatus();
  const { plans, loading: loadingPlans } = usePlansRewards();

  const handleSubscribe = (planId: number | string) => {
    // TODO: Redirect to Stripe checkout
    console.log(`Redirecting to checkout for plan: ${planId}`);
  };

  // Do not render anything if the trial is not expired or if data is still loading
  if (!isExpired || isLoading || loadingPlans) {
    return null;
  }

  return (
    <Dialog open={isExpired}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Seu período de teste terminou!</DialogTitle>
          <DialogDescription className="text-center">
            Para continuar sua jornada de transformação, por favor, escolha um de nossos planos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
          {(plans as Plan[]).map((plan: Plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div className="mb-4">
                  <p className="text-3xl font-bold">
                    R$ {plan.price}
                    <span className="text-sm font-normal">/mês</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{plan.description || 'Plano completo para sua evolução.'}</p>
                </div>
                <Button onClick={() => handleSubscribe(plan.id)} className="w-full">
                  Assinar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};