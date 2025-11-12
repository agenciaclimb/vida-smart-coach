import type { StageDetectionResult } from './stage-detection.ts';

type SupabaseClient = {
  from: (table: string) => any;
};

type ConversationGuardIssue =
  | 'repeated_assistant_prompt'
  | 'stagnant_stage'
  | 'missing_user_response';

export type ConversationGuardContext = {
  message: string;
  chatHistory?: Array<{ role: string; content: string }>;
  stageDetection: StageDetectionResult;
  currentStage: string;
};

export type ConversationGuardDecision = {
  issues: ConversationGuardIssue[];
  hints: string[];
  forceStage?: string;
  blockReply?: boolean;
};

export type ConversationGuardMetric = {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  stageBefore: string;
  stageAfter: string;
  action: string;
  issues: ConversationGuardIssue[];
  hints: string[];
  metadata?: Record<string, any>;
};

const STAGE_ORDER = ['sdr', 'specialist', 'seller', 'partner'];

export function evaluateConversationGuard(context: ConversationGuardContext): ConversationGuardDecision {
  const issues: ConversationGuardIssue[] = [];
  const hints: string[] = [];
  const chatHistory = context.chatHistory || [];

  const lastAssistant = chatHistory.filter((msg) => msg.role === 'assistant').slice(-2);
  if (
    lastAssistant.length === 2 &&
    sanitizeText(lastAssistant[0].content) === sanitizeText(lastAssistant[1].content)
  ) {
    issues.push('repeated_assistant_prompt');
    hints.push('As duas últimas respostas da IA foram idênticas; necessário mudar de abordagem.');
  }

  if (!context.stageDetection.stage || context.stageDetection.confidence < 0.2) {
    issues.push('stagnant_stage');
    hints.push('Detecção de estágio com baixa confiança; considere heurísticas adicionais.');
  }

  const lastUser = chatHistory.filter((msg) => msg.role === 'user').slice(-1)[0];
  if (!lastUser || sanitizeText(lastUser.content).length === 0 || sanitizeText(context.message).length === 0) {
    issues.push('missing_user_response');
    hints.push('Usuário não enviou conteúdo útil; aguardar confirmação antes de seguir.');
  }

  const decision: ConversationGuardDecision = { issues, hints };

  if (issues.includes('repeated_assistant_prompt')) {
    decision.forceStage = escalateStage(context.stageDetection.stage || context.currentStage);
  }

  if (issues.includes('missing_user_response')) {
    decision.blockReply = true;
  }

  return decision;
}

export async function recordConversationMetric(metric: ConversationGuardMetric) {
  try {
    await metric.supabase.from('conversation_metrics').insert({
      user_id: metric.userId,
      session_id: metric.sessionId,
      stage_before: metric.stageBefore,
      stage_after: metric.stageAfter,
      issues: metric.issues,
      hints: metric.hints,
      guard_action: metric.action,
      metadata: metric.metadata || {},
    });
  } catch (error) {
    console.error('[conversation_guard] metric insert failed', error);
  }
}

function escalateStage(stage: string): string {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  if (currentIndex === -1) {
    return 'specialist';
  }
  return STAGE_ORDER[Math.min(STAGE_ORDER.length - 1, currentIndex + 1)];
}

function sanitizeText(value?: string): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
