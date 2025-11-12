/**
 * Context prompt builder - Simplified and modular
 */

import type { UserContextData } from './types.ts';
import type { ConversationMemorySnapshot } from './context-formatters.ts';
import {
  formatGamification,
  formatRecentActivities,
  formatTodaysMissions,
  formatActiveGoals,
  formatPendingActions,
  formatActivePlans,
  formatMemorySnippets,
  formatConversationMemory,
  formatPendingFeedback,
  extractFirstName,
} from './context-formatters.ts';

/**
 * Builds context prompt for AI with all relevant user data
 * Refactored to reduce cognitive complexity from 27 to <15
 */
export function buildContextPrompt(
  userProfile: any,
  context: UserContextData,
  stage: string,
  memory?: ConversationMemorySnapshot,
  proactiveSuggestions?: Array<{ plan_type: string; item: string; reason: string }>
): string | null {
  if (!context) return null;

  const lines: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Stage information
  if (stage) {
    lines.push(`Estágio atual previsto: ${stage}.`);
  }

  // Gamification
  const gamificationText = formatGamification(context.gamification);
  if (gamificationText) lines.push(gamificationText);

  // Recent activities
  const activitiesText = formatRecentActivities(context.recentActivities, today);
  if (activitiesText) lines.push(activitiesText);

  // Today's missions
  const missionsText = formatTodaysMissions(context.todaysMissions);
  if (missionsText) lines.push(missionsText);

  // Active goals
  const goalsText = formatActiveGoals(context.activeGoals);
  if (goalsText) lines.push(goalsText);

  // Pending actions
  const actionsText = formatPendingActions(context.pendingActions);
  if (actionsText) lines.push(actionsText);

  // Active plans
  const plansText = formatActivePlans(context.activePlans);
  if (plansText) lines.push(plansText);

  // Proactive suggestions (if provided and plans exist)
  if (context.activePlans.length > 0 && proactiveSuggestions && proactiveSuggestions.length > 0) {
    const suggestionText = proactiveSuggestions
      .map(s => `"${s.item}" (${s.plan_type}) - ${s.reason}`)
      .join(' | ');
    lines.push(`💡 Sugestões proativas para agora: ${suggestionText}.`);
    lines.push(`INSTRUÇÃO: Mencione naturalmente uma dessas sugestões na conversa quando apropriado, sem forçar.`);
  }

  // Memory snippets
  const snippetsText = formatMemorySnippets(context.memorySnippets);
  if (snippetsText) lines.push(snippetsText);

  // Conversation memory
  const memoryLines = formatConversationMemory(memory);
  lines.push(...memoryLines);

  // Pending feedback
  const feedbackLines = formatPendingFeedback(context.pendingFeedback);
  lines.push(...feedbackLines);

  // Return null if no context
  if (lines.length === 0) return null;

  // Build header and return
  const firstName = extractFirstName(userProfile?.full_name || userProfile?.name);
  const header = firstName
    ? `Contexto operacional de ${firstName}:`
    : 'Contexto operacional do cliente:';

  return `${header}\n${lines.join('\n')}\nUse esses dados para personalizar a resposta, oferecendo próximos passos concretos e confirmando informações com o cliente.`;
}
