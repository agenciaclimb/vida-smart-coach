/**
 * Utility para gerenciar estado de onboarding do WhatsApp
 * Rastreia quando mostrar prompts estratégicos para engajar usuário
 */

const STORAGE_KEY = 'vida_whatsapp_onboarding';

/**
 * Estrutura do estado:
 * {
 *   hasSeenFirstPlanPrompt: boolean,
 *   hasSeenThirdCompletionPrompt: boolean,
 *   hasSeenChatTabPrompt: boolean,
 *   hasDismissedAll: boolean,
 *   lastPromptDate: string (ISO),
 *   whatsappConnected: boolean
 * }
 */

export const getWhatsAppOnboardingState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Erro ao ler estado de WhatsApp onboarding:', e);
  }
  
  return {
    hasSeenFirstPlanPrompt: false,
    hasSeenThirdCompletionPrompt: false,
    hasSeenChatTabPrompt: false,
    hasDismissedAll: false,
    lastPromptDate: null,
    whatsappConnected: false,
  };
};

export const updateWhatsAppOnboardingState = (updates) => {
  try {
    const current = getWhatsAppOnboardingState();
    const newState = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  } catch (e) {
    console.warn('Erro ao salvar estado de WhatsApp onboarding:', e);
    return null;
  }
};

/**
 * Verifica se deve mostrar prompt de WhatsApp após primeiro plano
 */
export const shouldShowFirstPlanPrompt = () => {
  const state = getWhatsAppOnboardingState();
  return !state.whatsappConnected && !state.hasSeenFirstPlanPrompt && !state.hasDismissedAll;
};

/**
 * Verifica se deve mostrar prompt após 3ª conclusão
 */
export const shouldShowThirdCompletionPrompt = (completionCount) => {
  const state = getWhatsAppOnboardingState();
  return (
    !state.whatsappConnected &&
    !state.hasSeenThirdCompletionPrompt &&
    !state.hasDismissedAll &&
    completionCount >= 3
  );
};

/**
 * Verifica se deve mostrar prompt na aba de chat
 */
export const shouldShowChatTabPrompt = () => {
  const state = getWhatsAppOnboardingState();
  return !state.whatsappConnected && !state.hasSeenChatTabPrompt && !state.hasDismissedAll;
};

/**
 * Marca WhatsApp como conectado e oculta todos os prompts
 */
export const markWhatsAppConnected = () => {
  return updateWhatsAppOnboardingState({
    whatsappConnected: true,
    hasDismissedAll: true,
  });
};

/**
 * Marca um prompt específico como visto
 */
export const markPromptSeen = (promptType) => {
  const updates = {
    lastPromptDate: new Date().toISOString(),
  };

  switch (promptType) {
    case 'first_plan':
      updates.hasSeenFirstPlanPrompt = true;
      break;
    case 'third_completion':
      updates.hasSeenThirdCompletionPrompt = true;
      break;
    case 'chat_tab':
      updates.hasSeenChatTabPrompt = true;
      break;
  }

  return updateWhatsAppOnboardingState(updates);
};

/**
 * Marca todos os prompts como dispensados (usuário não quer usar WhatsApp)
 */
export const dismissAllWhatsAppPrompts = () => {
  return updateWhatsAppOnboardingState({
    hasDismissedAll: true,
  });
};
