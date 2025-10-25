import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

const TOUR_STORAGE_KEY = 'vida_smart_tour_completed';

const tourStyles = {
  options: {
    primaryColor: '#10b981',
    zIndex: 10000,
  },
  tooltip: {
    fontSize: 16,
    padding: 20,
  },
  buttonNext: {
    backgroundColor: '#10b981',
    fontSize: 14,
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#6b7280',
    fontSize: 14,
    marginRight: 10,
  },
};

const steps = [
  {
    target: '[data-tour="generate-plan"]',
    content: 'Comece gerando seu plano personalizado nas 4 áreas: Físico, Alimentar, Emocional e Espiritual.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="plan-item"]',
    content: 'Marque os itens concluídos para ganhar pontos e acompanhar seu progresso!',
    placement: 'right',
  },
  {
    target: '[data-tour="ia-chat"]',
    content: 'Converse com a IA Coach 24/7 para tirar dúvidas, pedir ajustes ou motivação. Ela está aqui para você!',
    placement: 'bottom',
  },
];

const GuidedTour = ({ run = false, onComplete }) => {
  const { user } = useAuth();
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if tour was completed before
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted && run && user?.id) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => setRunTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [run, user?.id]);

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Mark tour as completed
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      
      // Optional: log completion to analytics or user_profiles
      try {
        if (user?.id) {
          await supabase
            .from('user_profiles')
            .update({ tour_completed_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      } catch (e) {
        console.warn('Failed to log tour completion:', e);
      }

      setRunTour(false);
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      styles={tourStyles}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular',
      }}
      callback={handleJoyrideCallback}
    />
  );
};

export default GuidedTour;
