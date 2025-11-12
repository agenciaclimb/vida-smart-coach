/**
 * Plan regeneration utilities
 * Reduces cognitive complexity from 21 to <10
 */

export interface AutomationAction {
  type: string;
  payload?: any;
}

export interface AutomationContext {
  userId: string;
  supabase: any;
  userProfile?: any;
}

export interface AutomationExecutionResult {
  type: string;
  payload?: any;
  success: boolean;
  message?: string;
  error?: string;
}

const VALID_PLAN_TYPES = new Set(['physical', 'nutritional', 'emotional', 'spiritual']);
const ALL_PLAN_TYPES = ['physical', 'nutritional', 'emotional', 'spiritual'];

/**
 * Normalizes plan type input to array
 */
export function normalizePlanTypes(rawPlanType: any): string[] {
  if (Array.isArray(rawPlanType)) {
    return rawPlanType.map((p: any) => String(p).toLowerCase());
  }
  
  if (typeof rawPlanType === 'string') {
    const normalized = rawPlanType.toLowerCase();
    return normalized === 'all' ? ALL_PLAN_TYPES : [normalized];
  }
  
  return ALL_PLAN_TYPES;
}

/**
 * Filters plan types to only valid ones
 */
export function filterValidPlanTypes(planTypes: string[]): string[] {
  const filtered = planTypes.filter(type => VALID_PLAN_TYPES.has(type));
  return filtered.length > 0 ? filtered : ALL_PLAN_TYPES;
}

/**
 * Applies profile overrides for plan generation
 */
export function applyProfileOverrides(profile: any, overrides: any): any {
  if (!overrides || typeof overrides !== 'object') {
    return profile;
  }
  return { ...profile, ...overrides };
}

/**
 * Deactivates current plan of given type
 */
export async function deactivateCurrentPlan(
  supabase: any,
  userId: string,
  planType: string
): Promise<void> {
  await supabase
    .from('user_training_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('plan_type', planType);
}

/**
 * Generates new plan via edge function
 */
export async function generateNewPlan(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
  planType: string,
  userProfile: any
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      userId,
      planType,
      userProfile,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao gerar plano ${planType}: ${errorBody}`);
  }
}

/**
 * Records feedback for plan regeneration
 */
export async function recordPlanFeedback(
  supabase: any,
  userId: string,
  planType: string,
  feedbackText: string
): Promise<void> {
  await supabase.from('plan_feedback').insert({
    user_id: userId,
    plan_type: planType,
    feedback_text: feedbackText,
    status: 'processed',
    processed_at: new Date().toISOString(),
    ai_response: 'Regenerado automaticamente pela IA Coach',
    plan_updated: true,
  });
}

/**
 * Formats result label based on number of plans
 */
export function formatResultLabel(planTypes: string[]): string {
  if (planTypes.length === 4) {
    return 'todos os seus planos';
  }
  
  if (planTypes.length === 1) {
    return `o plano ${planTypes[0]}`;
  }
  
  return `os planos ${planTypes.join(', ')}`;
}

/**
 * Regenerates plans for user
 * Reduced complexity: 21 → ~8
 */
export async function runRegeneratePlanAction(
  action: AutomationAction,
  context: AutomationContext,
  supabaseUrl: string,
  serviceKey: string
): Promise<AutomationExecutionResult> {
  // Validate configuration
  if (!supabaseUrl || !serviceKey) {
    return {
      type: action.type,
      payload: action.payload,
      success: false,
      error: 'Configuração Supabase incompleta para regenerar planos (URL ou chave ausente).',
    };
  }

  // Normalize and validate plan types
  const rawPlanType = action.payload?.plan_type;
  let planTypes = normalizePlanTypes(rawPlanType);
  planTypes = filterValidPlanTypes(planTypes);

  // Prepare profile with overrides
  const overrides = action.payload?.overrides || {};
  const profileSnapshot = applyProfileOverrides(context.userProfile || {}, overrides);

  // Process each plan type
  const results: string[] = [];
  
  for (const planType of planTypes) {
    try {
      await deactivateCurrentPlan(context.supabase, context.userId, planType);
      await generateNewPlan(supabaseUrl, serviceKey, context.userId, planType, profileSnapshot);

      // Record feedback if provided
      const feedbackSummary = action.payload?.summary;
      if (typeof feedbackSummary === 'string') {
        await recordPlanFeedback(context.supabase, context.userId, planType, feedbackSummary);
      }

      results.push(planType);
      
    } catch (error: any) {
      console.error(`[Automation] Erro ao regenerar plano ${planType}`, error);
      return {
        type: action.type,
        payload: action.payload,
        success: false,
        error: `Erro ao regenerar plano ${planType}: ${error?.message || error}`,
      };
    }
  }

  // Build success message
  const label = formatResultLabel(results);
  
  return {
    type: action.type,
    payload: action.payload,
    success: true,
    message: `✅ Pronto! Regerei automaticamente ${label}. Confere na aba "Meu Plano".`,
  };
}
