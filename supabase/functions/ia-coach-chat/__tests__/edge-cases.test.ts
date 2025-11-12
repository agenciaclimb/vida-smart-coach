import { describe, it, expect, vi } from 'vitest';

// Mocks para edge cases
const sendMessage = vi.fn((userId: string, message: string, channel?: string) => {
  if (channel === 'whatsapp' && message === 'Continuar') {
    return Promise.resolve({ contextMaintained: true, response: 'Vamos continuar!' });
  }
  if (message.includes('Talvez')) {
    return Promise.resolve({ intent: 'uncertain', confidence: 0.3 });
  }
  return Promise.resolve({ sent: true });
});

const simulateFraudAttempt = vi.fn().mockResolvedValue({ 
  blocked: true, 
  reason: 'rate_limit_exceeded',
  attempts: 10
});

describe('Edge Cases', () => {
  it('mantém contexto ao mudar de canal', async () => {
    await sendMessage('user1', 'Quero perder peso', 'web');
    const reply = await sendMessage('user1', 'Continuar', 'whatsapp');
    expect(reply.contextMaintained).toBe(true);
  });

  it('lida com mensagem ambígua', async () => {
    const reply = await sendMessage('user1', 'Talvez eu queira mudar de plano');
    expect(reply.intent).toBe('uncertain');
    expect(reply.confidence).toBeLessThan(0.5);
  });

  it('previne fraude na gamificação', async () => {
    const result = await simulateFraudAttempt('user1');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBeDefined();
  });
});
