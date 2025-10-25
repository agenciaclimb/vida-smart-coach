import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const OnboardingTour = ({ run, onFinish }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Bem-vindo ao Vida Smart Coach! 🎉</h3>
          <p>Vamos fazer um tour rápido de 1 minuto para você começar sua transformação.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="generate-plan"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">1. Gere seu Plano</h3>
          <p>Clique aqui para a IA criar seu plano personalizado nas 4 áreas: físico, alimentar, emocional e espiritual.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="complete-item"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">2. Marque suas Conquistas</h3>
          <p>Ao completar exercícios, refeições ou práticas, clique nos checkboxes para ganhar pontos e acompanhar seu progresso.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="chat-ia"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">3. Fale com sua IA Coach</h3>
          <p>Tire dúvidas, peça ajustes no plano e receba motivação 24/7 pelo chat ou WhatsApp.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="whatsapp-button"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">💬 Use pelo WhatsApp!</h3>
          <p className="font-semibold text-primary">Dica de ouro: conecte seu WhatsApp para receber lembretes, dicas e conversar com a IA de onde estiver!</p>
          <p className="text-sm text-gray-600">É mais prático e você nunca perde o contato com seu coach.</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, index, type } = data;

    if (type === 'step:after') {
      setStepIndex(index + 1);
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour finalizado
      setStepIndex(0);
      if (onFinish) onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#10b981',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#10b981',
          borderRadius: 8,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 8,
        },
        buttonSkip: {
          color: '#9ca3af',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
};

export default OnboardingTour;
