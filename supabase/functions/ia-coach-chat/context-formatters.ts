/**
 * Context formatters - Extract and format specific data types for AI context
 */

import type { UserContextData } from './types.ts';

export interface ConversationMemorySnapshot {
  entities: {
    user_goals: string[];
    pain_points: string[];
    restrictions: string[];
    emotional_state?: string;
  };
}

/**
 * Limits text to specified length
 */
export function limitText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Formats gamification data
 */
export function formatGamification(gamification: any): string | null {
  if (!gamification) return null;
  
  const points = gamification.total_points ?? 0;
  const level = gamification.level ?? 1;
  const streak = gamification.current_streak ?? 0;
  
  return `Gamificação: ${points} pontos totais, nível ${level}, sequência atual ${streak} dias.`;
}

/**
 * Formats recent activities
 */
export function formatRecentActivities(
  recentActivities: any[],
  today: string
): string | null {
  if (!recentActivities || recentActivities.length === 0) return null;

  const todaysActivities = recentActivities
    .filter((activity: any) => activity.activity_date === today)
    .slice(0, 2)
    .map((activity: any) => 
      `${activity.activity_name} (+${activity.points_earned ?? 0} pts)`
    );

  if (todaysActivities.length > 0) {
    return `Atividades de hoje: ${todaysActivities.join(', ')}.`;
  }

  const latestActivity = recentActivities[0];
  const dateFormatted = formatIsoDate(latestActivity.activity_date);
  return `Atividade mais recente registrada: ${latestActivity.activity_name} em ${dateFormatted} (+${latestActivity.points_earned ?? 0} pts).`;
}

/**
 * Formats today's missions
 */
export function formatTodaysMissions(missions: any[]): string | null {
  if (!missions || missions.length === 0) return null;

  const missionSummary = missions
    .map((mission: any) => `${mission.title} (${mission.points_reward ?? 0} pts)`)
    .join(', ');
  
  return `Missões do dia em aberto: ${missionSummary}.`;
}

/**
 * Formats active goals
 */
export function formatActiveGoals(goals: any[]): string | null {
  if (!goals || goals.length === 0) return null;

  const goalSummary = goals
    .map((goal: any) => 
      `${goal.area}: ${limitText(goal.description || goal.goal_type, 80)}`
    )
    .join(' | ');
  
  return `Metas ativas: ${goalSummary}.`;
}

/**
 * Formats pending actions
 */
export function formatPendingActions(actions: any[]): string | null {
  if (!actions || actions.length === 0) return null;

  const actionSummary = actions
    .map((action: any) => {
      const dateInfo = action.scheduled_for 
        ? ` para ${formatIsoDate(action.scheduled_for)}` 
        : '';
      return `${action.title}${dateInfo}`;
    })
    .join(' | ');
  
  return `Próximas ações sugeridas: ${actionSummary}.`;
}

/**
 * Formats active plans
 */
export function formatActivePlans(plans: any[]): string | null {
  if (!plans || plans.length === 0) return null;

  const planSummary = plans
    .map((plan: any) => {
      const planName = plan.plan_data?.title || plan.plan_type;
      return `${planName} (${plan.experience_level ?? 'geral'})`;
    })
    .join(' | ');
  
  return `Planos ativos: ${planSummary}.`;
}

/**
 * Formats memory snippets
 */
export function formatMemorySnippets(snippets: any[]): string | null {
  if (!snippets || snippets.length === 0) return null;

  const memories = snippets
    .map((memory: any) => 
      `${memory.memory_type}: ${limitText(memory.content, 80)}`
    )
    .join(' | ');
  
  return `Notas importantes: ${memories}.`;
}

/**
 * Formats conversation memory entities
 */
export function formatConversationMemory(memory: ConversationMemorySnapshot | undefined): string[] {
  if (!memory) return [];

  const lines: string[] = [];
  const entities = memory.entities;

  if (entities.user_goals.length > 0) {
    lines.push(`Memória - Objetivos declarados: ${entities.user_goals.join(', ')}.`);
  }
  if (entities.pain_points.length > 0) {
    lines.push(`Memória - Dores recorrentes: ${entities.pain_points.join(', ')}.`);
  }
  if (entities.restrictions.length > 0) {
    lines.push(`Memória - Restrições: ${entities.restrictions.join(', ')}.`);
  }
  if (entities.emotional_state) {
    lines.push(`Memória - Estado emocional recente: ${entities.emotional_state}.`);
  }

  return lines;
}

/**
 * Formats pending feedback
 */
export function formatPendingFeedback(feedback: any[]): string[] {
  if (!feedback || feedback.length === 0) return [];

  const fb = feedback
    .slice(0, 2)
    .map((f: any) => `${f.plan_type}: "${limitText(f.feedback_text, 80)}"`)
    .join(' | ');
  
  return [
    `Feedback pendente do usuário: ${fb}.`,
    `Ação sugerida: reconheça o feedback e ofereça ajustar/regenerar o plano correspondente, confirmando preferências em 1 pergunta curta.`
  ];
}

/**
 * Formats ISO date to DD/MM format
 */
export function formatIsoDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Extracts first name from full name
 */
export function extractFirstName(fullName?: string): string {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 0 ? parts[0] : fullName;
}
