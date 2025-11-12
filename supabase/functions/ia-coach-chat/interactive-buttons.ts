/**
 * Interactive Buttons - Stage-based Quick Actions for WhatsApp
 * 
 * Provides context-aware button suggestions based on user's current stage
 * in the coaching journey.
 */

export type UserStage = 'SDR' | 'Specialist' | 'Seller' | 'Partner';

export interface InteractiveButton {
  id: string;
  text: string;
  emoji: string;
  action: string; // Action identifier for handling response
}

export interface ButtonSuggestion {
  message: string;
  buttons: InteractiveButton[];
}

/**
 * Get interactive buttons based on user stage
 */
export function getStageButtons(stage: UserStage): InteractiveButton[] {
  const buttonMap: Record<UserStage, InteractiveButton[]> = {
    SDR: [
      {
        id: 'questionnaire',
        text: 'Preencher Questionário',
        emoji: '📝',
        action: 'start_questionnaire',
      },
      {
        id: 'chat',
        text: 'Falar com IA',
        emoji: '💬',
        action: 'start_chat',
      },
      {
        id: 'learn_more',
        text: 'Saber Mais',
        emoji: 'ℹ️',
        action: 'learn_more',
      },
    ],
    Specialist: [
      {
        id: 'view_plan',
        text: 'Ver Meu Plano',
        emoji: '📋',
        action: 'view_plan',
      },
      {
        id: 'log_activity',
        text: 'Registrar Atividade',
        emoji: '✅',
        action: 'log_activity',
      },
      {
        id: 'schedule',
        text: 'Agendar',
        emoji: '📅',
        action: 'schedule_activity',
      },
      {
        id: 'adjust_plan',
        text: 'Ajustar Plano',
        emoji: '🔧',
        action: 'adjust_plan',
      },
    ],
    Seller: [
      {
        id: 'subscribe',
        text: 'Assinar Agora',
        emoji: '💳',
        action: 'start_subscription',
      },
      {
        id: 'questions',
        text: 'Dúvidas',
        emoji: '❓',
        action: 'ask_questions',
      },
      {
        id: 'compare',
        text: 'Comparar Planos',
        emoji: '📊',
        action: 'compare_plans',
      },
      {
        id: 'trial',
        text: 'Testar Grátis',
        emoji: '🎁',
        action: 'start_trial',
      },
    ],
    Partner: [
      {
        id: 'progress',
        text: 'Ver Progresso',
        emoji: '🎯',
        action: 'view_progress',
      },
      {
        id: 'achievements',
        text: 'Minhas Conquistas',
        emoji: '🏆',
        action: 'view_achievements',
      },
      {
        id: 'suggestions',
        text: 'Sugestões',
        emoji: '💡',
        action: 'get_suggestions',
      },
      {
        id: 'rewards',
        text: 'Recompensas',
        emoji: '🎁',
        action: 'view_rewards',
      },
    ],
  };

  return buttonMap[stage] || buttonMap.Specialist;
}

/**
 * Format buttons as WhatsApp-style text menu
 */
export function formatButtonsAsMenu(buttons: InteractiveButton[]): string {
  let menu = '\n\n*🎯 Ações Rápidas:*\n';
  
  buttons.forEach((button, index) => {
    menu += `${button.emoji} Responda *${index + 1}* para: ${button.text}\n`;
  });

  return menu;
}

/**
 * Get button suggestion with contextual message
 */
export function getButtonSuggestion(
  stage: UserStage,
  context?: {
    hasActivePlan?: boolean;
    hasCompletedToday?: boolean;
    xp?: number;
    needsAdjustment?: boolean;
  }
): ButtonSuggestion | null {
  const buttons = getStageButtons(stage);

  // Contextual messages based on stage and context
  switch (stage) {
    case 'SDR':
      return {
        message: '✨ *Pronto para começar sua jornada de transformação?*',
        buttons: buttons.slice(0, 2), // Only questionnaire and chat
      };

    case 'Specialist':
      if (context?.needsAdjustment) {
        return {
          message: '🔧 *Vamos ajustar seu plano para algo melhor?*',
          buttons: [buttons[3]], // Only adjust plan
        };
      }
      if (!context?.hasCompletedToday) {
        return {
          message: '💪 *Hora de registrar suas atividades de hoje!*',
          buttons: [buttons[1], buttons[0]], // Log activity + view plan
        };
      }
      return {
        message: '🌟 *Como posso te ajudar hoje?*',
        buttons: buttons.slice(0, 3), // View, log, schedule
      };

    case 'Seller':
      return {
        message: '🚀 *Pronto para desbloquear todo o potencial do Vida Smart?*',
        buttons: buttons.slice(0, 3), // Subscribe, questions, compare
      };

    case 'Partner':
      if (context?.xp && context.xp >= 5000) {
        return {
          message: '✨ *Você tem XP suficiente para resgatar recompensas!*',
          buttons: [buttons[3], buttons[0]], // Rewards + progress
        };
      }
      return {
        message: '🎯 *Continue evoluindo! O que deseja fazer?*',
        buttons: buttons.slice(0, 3), // Progress, achievements, suggestions
      };

    default:
      return null;
  }
}

/**
 * Parse user response to button menu
 */
export function parseButtonResponse(
  response: string,
  buttons: InteractiveButton[]
): InteractiveButton | null {
  // Try to parse as number
  const num = parseInt(response.trim());
  if (!isNaN(num) && num >= 1 && num <= buttons.length) {
    return buttons[num - 1];
  }

  // Try to match text
  const lowerResponse = response.toLowerCase().trim();
  for (const button of buttons) {
    if (
      lowerResponse.includes(button.text.toLowerCase()) ||
      lowerResponse.includes(button.action.replace(/_/g, ' '))
    ) {
      return button;
    }
  }

  return null;
}

/**
 * Get action handler instructions for AI
 */
export function getActionInstructions(action: string): string {
  const instructions: Record<string, string> = {
    start_questionnaire:
      'Guie o usuário pelo questionário dos 4 Pilares. Faça perguntas sobre físico, nutricional, emocional e espiritual.',
    start_chat:
      'Inicie uma conversa amigável perguntando como o usuário está e o que deseja melhorar na vida.',
    learn_more:
      'Explique os benefícios do Vida Smart Coach: planos personalizados, IA coach 24/7, gamificação e acompanhamento.',
    view_plan:
      'Mostre um resumo do plano atual do usuário com as atividades principais de cada pilar.',
    log_activity:
      'Pergunte qual atividade do plano o usuário completou hoje e registre.',
    schedule_activity:
      'Ajude o usuário a agendar uma atividade do plano para um horário específico.',
    adjust_plan:
      'Pergunte o que o usuário gostaria de ajustar no plano e colete feedback.',
    start_subscription:
      'Explique os planos Premium e Pro, benefícios de cada um, e ofereça o link de assinatura.',
    ask_questions:
      'Responda dúvidas sobre planos, funcionalidades, preços e suporte.',
    compare_plans:
      'Mostre uma comparação clara entre Free, Premium e Pro.',
    start_trial:
      'Ofereça trial gratuito de 7 dias do plano Premium.',
    view_progress:
      'Mostre estatísticas completas: XP, nível, streak, conquistas, progresso nos 4 pilares.',
    view_achievements:
      'Liste todas as conquistas do usuário (desbloqueadas e próximas).',
    get_suggestions:
      'Analise o progresso e sugira próximas ações ou melhorias personalizadas.',
    view_rewards:
      'Mostre o catálogo de recompensas disponíveis com o XP do usuário.',
  };

  return instructions[action] || 'Continue a conversa naturalmente.';
}

/**
 * Check if message is a button response
 */
export function isButtonResponse(message: string): boolean {
  // Check if it's a single number (1-4)
  if (/^[1-4]$/.test(message.trim())) {
    return true;
  }

  // Check if it matches common button keywords
  const keywords = [
    'questionário',
    'falar',
    'chat',
    'plano',
    'registrar',
    'atividade',
    'agendar',
    'ajustar',
    'assinar',
    'dúvida',
    'comparar',
    'progresso',
    'conquista',
    'sugestão',
    'recompensa',
  ];

  const lowerMessage = message.toLowerCase();
  return keywords.some(kw => lowerMessage.includes(kw));
}

/**
 * Generate follow-up message after button action
 */
export function getFollowUpMessage(action: string): string {
  const followUps: Record<string, string> = {
    start_questionnaire:
      '📝 Ótimo! Vamos começar pelo pilar físico. Como você avaliaria sua condição física atual de 1 a 10?',
    start_chat:
      '💬 Olá! Estou aqui para te ajudar. Como você está se sentindo hoje?',
    view_plan:
      '📋 Aqui está seu plano personalizado. Qual atividade você quer começar?',
    log_activity:
      '✅ Qual atividade você completou? (Ex: "completei treino de pernas")',
    schedule_activity:
      '📅 Qual atividade você quer agendar e para quando?',
    adjust_plan:
      '🔧 O que você gostaria de ajustar no seu plano?',
    start_subscription:
      '💳 Vou te mostrar nossos planos! Qual é seu principal objetivo?',
    view_progress:
      '🎯 Carregando suas estatísticas...',
    view_achievements:
      '🏆 Suas conquistas são incríveis! Veja o que você já desbloqueou:',
    view_rewards:
      '🎁 Veja as recompensas disponíveis com seu XP:',
  };

  return followUps[action] || 'Entendido! Como posso ajudar?';
}

/**
 * Get contextual buttons based on message content
 */
export function getContextualButtons(
  message: string,
  stage: UserStage
): InteractiveButton[] | null {
  const lowerMessage = message.toLowerCase();

  // Difficulty detected -> suggest plan adjustment
  if (lowerMessage.includes('difícil') || lowerMessage.includes('não consigo')) {
    return [
      {
        id: 'adjust',
        text: 'Ajustar Plano',
        emoji: '🔧',
        action: 'adjust_plan',
      },
      {
        id: 'support',
        text: 'Falar com Suporte',
        emoji: '💬',
        action: 'contact_support',
      },
    ];
  }

  // Progress inquiry -> show stats
  if (
    lowerMessage.includes('progresso') ||
    lowerMessage.includes('como estou') ||
    lowerMessage.includes('meu desempenho')
  ) {
    return [
      {
        id: 'stats',
        text: 'Ver Estatísticas',
        emoji: '📊',
        action: 'view_progress',
      },
      {
        id: 'achievements',
        text: 'Conquistas',
        emoji: '🏆',
        action: 'view_achievements',
      },
    ];
  }

  // XP/rewards inquiry
  if (lowerMessage.includes('xp') || lowerMessage.includes('recompensa')) {
    return [
      {
        id: 'rewards',
        text: 'Ver Recompensas',
        emoji: '🎁',
        action: 'view_rewards',
      },
      {
        id: 'xp',
        text: 'Meu XP',
        emoji: '⭐',
        action: 'view_progress',
      },
    ];
  }

  // Default to stage buttons
  return null;
}
