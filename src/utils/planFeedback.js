/**
 * Utilidade centralizada para feedback de planos
 * Reduz duplicação de código nos handlers de feedback
 */

import { toast } from 'react-hot-toast';

/**
 * Envia feedback de um plano específico
 * @param {Object} supabase - Cliente Supabase
 * @param {Object} user - Usuário autenticado
 * @param {string} planType - Tipo do plano (physical, nutritional, emotional, spiritual)
 * @param {string} feedbackText - Texto do feedback
 * @param {Function} navigate - Função de navegação do React Router
 * @returns {Promise<boolean>} - true se sucesso, false se erro
 */
export async function submitPlanFeedback(supabase, user, planType, feedbackText, navigate) {
  if (!feedbackText || !feedbackText.trim()) {
    toast.error('Por favor, escreva seu feedback');
    return false;
  }
  
  if (!user?.id) {
    toast.error('Você precisa estar autenticado');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('plan_feedback')
      .insert({
        user_id: user.id,
        plan_type: planType,
        feedback_text: feedbackText.trim(),
        status: 'pending'
      })
      .select();
    
    if (error) {
      console.error(`[Feedback ${planType}] Erro do Supabase:`, error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error(`[Feedback ${planType}] RLS pode estar bloqueando`);
      toast.error('Feedback não foi salvo. Verifique se você está autenticado.');
      return false;
    }
    
    toast.success('✅ Feedback enviado! A Vida vai te ajudar agora.', {
      duration: 4000
    });
    
    // Redireciona para o chat após 1 segundo
    setTimeout(() => {
      navigate('/dashboard?tab=chat', { 
        state: { 
          autoMessage: `Quero ajustar meu plano ${getPlanName(planType)}: ${feedbackText.trim()}` 
        }
      });
    }, 1000);
    
    return true;
  } catch (error) {
    console.error(`[Feedback ${planType}] Erro:`, error);
    toast.error('Erro ao enviar feedback. Tente novamente.');
    return false;
  }
}

/**
 * Retorna o nome amigável do tipo de plano
 * @param {string} planType - Tipo do plano
 * @returns {string} - Nome amigável
 */
function getPlanName(planType) {
  const names = {
    physical: 'físico',
    nutritional: 'alimentar',
    emotional: 'emocional',
    spiritual: 'espiritual'
  };
  return names[planType] || planType;
}

/**
 * Valida se o texto de feedback é adequado
 * @param {string} text - Texto para validar
 * @returns {Object} - { valid: boolean, message: string }
 */
export function validateFeedback(text) {
  if (!text || !text.trim()) {
    return { valid: false, message: 'Por favor, escreva seu feedback' };
  }
  
  if (text.trim().length < 10) {
    return { valid: false, message: 'Feedback muito curto. Por favor, seja mais específico.' };
  }
  
  if (text.length > 500) {
    return { valid: false, message: 'Feedback muito longo. Máximo 500 caracteres.' };
  }
  
  return { valid: true, message: '' };
}
