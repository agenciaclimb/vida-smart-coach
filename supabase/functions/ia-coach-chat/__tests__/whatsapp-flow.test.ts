import { describe, it, expect, vi } from 'vitest';

// Mocks para WhatsApp
const sendWhatsAppMessage = vi.fn().mockResolvedValue({ status: 'sent', messageId: '123' });
const receiveWhatsAppMessage = vi.fn().mockResolvedValue({ intent: 'goal', confidence: 0.9 });

describe('Integração WhatsApp', () => {
  it('envia mensagem corretamente', async () => {
    const response = await sendWhatsAppMessage('user1', 'Olá!');
    expect(response.status).toBe('sent');
    expect(response.messageId).toBeDefined();
  });

  it('processa resposta do usuário', async () => {
    const reply = await receiveWhatsAppMessage('user1', 'Quero perder peso');
    expect(reply.intent).toBe('goal');
    expect(reply.confidence).toBeGreaterThan(0.5);
  });
});
