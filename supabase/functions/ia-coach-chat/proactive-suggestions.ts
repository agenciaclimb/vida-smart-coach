/**
 * Proactive suggestions system - Strategy pattern for time-based recommendations
 */

import type { UserContextData } from './types.ts';

export interface ProactiveSuggestion {
  plan_type: string;
  item: string;
  reason: string;
}

export interface PlanItem {
  identifier: string;
  description: string;
}

/**
 * Determines priority plan types based on current hour
 */
export function getPriorityTypesByHour(hour: number): string[] {
  // Morning (5-12) = physical/nutritional
  if (hour >= 5 && hour < 12) {
    return ['physical', 'nutritional'];
  }
  
  // Afternoon (12-18) = emotional
  if (hour >= 12 && hour < 18) {
    return ['emotional'];
  }
  
  // Evening/Night (18-23) = spiritual
  return ['spiritual'];
}

/**
 * Gets time-based reason for a suggestion
 */
export function getTimeBasedReason(hour: number, planType: string): string {
  if (hour >= 5 && hour < 12) {
    if (planType === 'physical') return 'Ótimo horário para treinar pela manhã';
    if (planType === 'nutritional') return 'Momento ideal para um café da manhã nutritivo';
  } else if (hour >= 12 && hour < 18) {
    if (planType === 'emotional') return 'Que tal uma pausa para cuidar das emoções?';
  } else {
    if (planType === 'spiritual') return 'Hora perfeita para uma prática espiritual';
  }
  return 'Item do seu plano ativo';
}

/**
 * Gets completed identifiers for today
 */
export function getTodayCompletedIdentifiers(planCompletions: any[]): Set<string> {
  if (!planCompletions) return new Set();

  const today = new Date();
  
  return new Set(
    planCompletions
      .filter(c => {
        const completedDate = new Date(c.completed_at);
        return completedDate.toDateString() === today.toDateString();
      })
      .map(c => c.item_identifier)
  );
}

/**
 * Finds incomplete items from a plan
 */
export function findIncompleteItems(
  planItems: PlanItem[],
  completedIdentifiers: Set<string>
): PlanItem[] {
  return planItems.filter(item => !completedIdentifiers.has(item.identifier));
}

/**
 * Creates a suggestion from a plan item
 */
export function createSuggestion(
  planType: string,
  item: PlanItem,
  reason: string
): ProactiveSuggestion {
  return {
    plan_type: planType,
    item: item.description,
    reason,
  };
}

/**
 * Collects suggestions from plans matching priority types
 */
export function collectPrioritySuggestions(
  activePlans: any[],
  priorityTypes: string[],
  completedIdentifiers: Set<string>,
  hour: number,
  maxSuggestions: number,
  extractPlanItemsFn: (planData: any, planType: string) => PlanItem[]
): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = [];

  for (const plan of activePlans) {
    if (suggestions.length >= maxSuggestions) break;
    
    if (!priorityTypes.includes(plan.plan_type)) continue;

    const items = extractPlanItemsFn(plan.plan_data, plan.plan_type);
    const incompleteItems = findIncompleteItems(items, completedIdentifiers);

    if (incompleteItems.length > 0) {
      const reason = getTimeBasedReason(hour, plan.plan_type);
      suggestions.push(createSuggestion(plan.plan_type, incompleteItems[0], reason));
    }
  }

  return suggestions;
}

/**
 * Collects fallback suggestions from non-priority plans
 */
export function collectFallbackSuggestions(
  activePlans: any[],
  priorityTypes: string[],
  completedIdentifiers: Set<string>,
  currentSuggestionCount: number,
  maxSuggestions: number,
  extractPlanItemsFn: (planData: any, planType: string) => PlanItem[]
): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = [];
  let count = currentSuggestionCount;

  for (const plan of activePlans) {
    if (count >= maxSuggestions) break;
    
    if (priorityTypes.includes(plan.plan_type)) continue;

    const items = extractPlanItemsFn(plan.plan_data, plan.plan_type);
    const incompleteItems = findIncompleteItems(items, completedIdentifiers);

    if (incompleteItems.length > 0) {
      suggestions.push(
        createSuggestion(plan.plan_type, incompleteItems[0], 'Item pendente do seu plano')
      );
      count++;
    }
  }

  return suggestions;
}

/**
 * Main function: selects proactive suggestions based on context
 * Refactored to reduce cognitive complexity from 24 to <10
 */
export function selectProactiveSuggestions(
  context: UserContextData,
  extractPlanItemsFn: (planData: any, planType: string) => PlanItem[]
): ProactiveSuggestion[] {
  const { activePlans, planCompletions } = context;
  
  if (!activePlans || activePlans.length === 0) return [];

  const hour = new Date().getHours();
  const maxSuggestions = 2;
  
  const priorityTypes = getPriorityTypesByHour(hour);
  const completedIdentifiers = getTodayCompletedIdentifiers(planCompletions || []);

  // Collect priority suggestions
  let suggestions = collectPrioritySuggestions(
    activePlans,
    priorityTypes,
    completedIdentifiers,
    hour,
    maxSuggestions,
    extractPlanItemsFn
  );

  // Collect fallback suggestions if needed
  if (suggestions.length < maxSuggestions) {
    const fallbackSuggestions = collectFallbackSuggestions(
      activePlans,
      priorityTypes,
      completedIdentifiers,
      suggestions.length,
      maxSuggestions,
      extractPlanItemsFn
    );
    suggestions = [...suggestions, ...fallbackSuggestions];
  }

  return suggestions;
}
