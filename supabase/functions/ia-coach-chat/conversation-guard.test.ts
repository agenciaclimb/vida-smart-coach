import { describe, expect, it, vi } from 'vitest';

import { evaluateConversationGuard, recordConversationMetric } from './conversation-guard';

const baseStageDetection = {
  stage: 'sdr',
  confidence: 0.9,
  metrics: {},
  reason: null,
} as const;

const baseContext = {
  message: 'Tudo certo por aqui',
  chatHistory: [],
  stageDetection: baseStageDetection,
  currentStage: 'sdr',
};

describe('evaluateConversationGuard', () => {
  it('força avanço de estágio quando o bot repete a mesma resposta duas vezes', () => {
    const decision = evaluateConversationGuard({
      ...baseContext,
      chatHistory: [
        { role: 'assistant', content: 'Pode me contar sua rotina?' },
        { role: 'assistant', content: 'Pode me contar sua rotina?' },
      ],
    });

    expect(decision.forceStage).toBe('specialist');
    expect(decision.issues).toContain('repeated_assistant_prompt');
  });

  it('bloqueia resposta quando a última mensagem do usuário está vazia', () => {
    const decision = evaluateConversationGuard({
      ...baseContext,
      message: '',
      chatHistory: [{ role: 'user', content: '  ' }],
    });

    expect(decision.blockReply).toBe(true);
    expect(decision.issues).toContain('missing_user_response');
  });
});

describe('recordConversationMetric', () => {
  it('insere registro na tabela conversation_metrics', async () => {
    const insert = vi.fn().mockResolvedValue({});
    const supabaseMock = {
      from: vi.fn().mockReturnValue({ insert }),
    };

    await recordConversationMetric({
      supabase: supabaseMock,
      userId: 'user-123',
      sessionId: '2025-11-11',
      stageBefore: 'sdr',
      stageAfter: 'specialist',
      action: 'force_stage:specialist',
      issues: ['repeated_assistant_prompt'],
      hints: ['Trocar de abordagem'],
      metadata: { debug: true },
    });

    expect(supabaseMock.from).toHaveBeenCalledWith('conversation_metrics');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        session_id: '2025-11-11',
        guard_action: 'force_stage:specialist',
        issues: ['repeated_assistant_prompt'],
      }),
    );
  });
});
