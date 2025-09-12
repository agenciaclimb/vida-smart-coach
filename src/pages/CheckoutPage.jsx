import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Helmet } from 'react-helmet';
import { toast } from 'react-hot-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const { user, loading: loadingAuth, refetchUser } = useAuth();
  const { plans, loading: loadingPlans } = useData();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const planId = searchParams.get('plan_id');

    if (!planId) {
      toast.error('Nenhum plano selecionado.');
      navigate('/#planos');
      return;
    }

    if (!loadingPlans && plans.length > 0) {
      const plan = plans.find(p => p.stripe_price_id === planId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        toast.error('Plano inválido ou não encontrado.');
        navigate('/#planos');
      }
    }
  }, [location.search, navigate, plans, loadingPlans]);

  const handleCheckout = useCallback(async () => {
    if (!selectedPlan || !user?.id || !user?.email || !user?.profile) {
      toast.error('Informações de plano ou usuário incompletas. Faça login e tente novamente.');
      setIsRedirecting(false);
      return;
    }

    if (isRedirecting) return;
    setIsRedirecting(true);
    const toastId = toast.loading('Redirecionando para o pagamento...');

    try {
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: selectedPlan.stripe_price_id, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/checkout?plan_id=${selectedPlan.stripe_price_id}`,
        customerEmail: user.email,
        clientReferenceId: user.id,
        subscriptionData: {
          metadata: {
            user_id: user.id,
            plan_name: selectedPlan.name,
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast.error(`Erro no checkout: ${error.message}`, { id: toastId });
      setIsRedirecting(false);
    }
  }, [selectedPlan, user, isRedirecting]);

  useEffect(() => {
    if (loadingAuth) {
      return; 
    }
    
    if (user && !user.profile) {
      refetchUser(true);
      return;
    }

    if (selectedPlan && user?.profile && !loadingPlans) {
      handleCheckout();
    }
  }, [selectedPlan, user, loadingAuth, loadingPlans, handleCheckout, refetchUser]);
  
  return (
    <>
      <Helmet>
        <title>Checkout - Vida Smart</title>
        <meta name="description" content="Finalize sua assinatura de forma segura." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="vida-smart-gradient w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Redirecionando para um ambiente seguro</h1>
          <p className="text-gray-600 mb-8">
            Você está sendo redirecionado para a página de pagamento do Stripe. Por favor, aguarde.
          </p>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center text-lg mb-4">
              <span className="font-medium text-gray-700">Plano Selecionado:</span>
              <span className="font-bold text-primary">{selectedPlan?.name || 'Carregando...'}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-gray-700">Valor:</span>
              <span className="font-bold text-primary">
                {selectedPlan ? `R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}/mês` : '...'}
              </span>
            </div>
          </div>
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mt-10" />
          <p className="text-sm text-gray-500 mt-4">Se você não for redirecionado em alguns segundos, o processo será reiniciado.</p>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;