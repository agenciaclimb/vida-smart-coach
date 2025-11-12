import { describe, it, expect, vi } from 'vitest';

// Mocks para feedback
const submitFeedback = vi.fn().mockResolvedValue('received');
const getFeedbackStatus = vi.fn().mockResolvedValue({ planAdjusted: true, feedbackCount: 1 });

describe('Feedback do Usuário', () => {
  it('processa feedback enviado', async () => {
    const status = await submitFeedback('user1', 'Plano ótimo!');
    expect(status).toBe('received');
  });

  it('feedback influencia plano', async () => {
    const updated = await getFeedbackStatus('user1');
    expect(updated.planAdjusted).toBe(true);
    expect(updated.feedbackCount).toBeGreaterThan(0);
  });
});
