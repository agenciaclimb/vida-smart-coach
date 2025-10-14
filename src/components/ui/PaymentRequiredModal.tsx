
import React, { useEffect, useState } from 'react';
import useTrialStatus from '@/hooks/useTrialStatus';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

// Componentes de UI
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';

interface Plan {
  id: string;
  name: string;
  details: string; // Usando 'details' em vez de 'description'
  price: number;
  stripe_price_id: string;
}

export const PaymentRequiredModal: React.FC = () => {
  const { isExpired, isActive } = useTrialStatus();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const { data, error } = await supabase
          .from('plans')
          .select('id, name, details, price, stripe_price_id')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (error) {
          throw error;
        }
        setPlans(data || []);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const isVisible = isExpired && !isActive;

  if (!isVisible) {
    return null;
  }

  const handleSelectPlan = (stripePriceId: string) => {
    navigate(`/checkout?plan=${stripePriceId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl mx-4 text-center p-6 md:p-8 bg-white shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-gray-800">Seu período de teste terminou</CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Para continuar sua jornada de transformação, por favor, escolha um de nossos planos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <p>Carregando planos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {plans.map((plan) => (
                <Card key={plan.id} className="flex flex-col justify-between p-6 border-2 hover:border-blue-500 transition-all duration-300">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                    <p className="text-gray-500 mt-2 h-20">{plan.details}</p>
                    <p className="text-4xl font-extrabold text-gray-900 my-4">
                      R${plan.price}
                      <span className="text-base font-medium text-gray-500">/mês</span>
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleSelectPlan(plan.stripe_price_id)} 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-lg"
                  >
                    Assinar Agora
                  </Button>
                </Card>
              ))}
            </div>
          )}
           <div className="mt-8">
              <p className="text-sm text-gray-500">Dúvidas? <a href="mailto:suporte@vidasmart.com" className="text-blue-600 hover:underline">Fale com o suporte</a>.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
