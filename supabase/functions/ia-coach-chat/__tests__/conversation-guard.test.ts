import { describe, it, expect } from 'vitest';
import { evaluateConversationGuard } from '../conversation-guard';

describe('Conversation Guard - Cenários críticos', () => {
  it('detecta prompts repetidos do assistente', () => {
    const context = {
      message: 'Olá, como posso ajudar?',
      chatHistory: [
        { role: 'assistant', content: 'Qual seu objetivo principal?' },
        { role: 'assistant', content: 'Qual seu objetivo principal?' },
        { role: 'user', content: 'Quero perder peso.' }
      ],
      stageDetection: { stage: 'sdr', confidence: 0.9, metrics: {}, reason: '' },
      currentStage: 'sdr',
    };
    const result = evaluateConversationGuard(context);
    expect(result.issues).toContain('repeated_assistant_prompt');
    expect(result.forceStage).toBe('specialist');
  });

  it('detecta estagnação de estágio por baixa confiança', () => {
    const context = {
      message: 'Estou cansado.',
      chatHistory: [
        { role: 'assistant', content: 'Como você está se sentindo?' },
        { role: 'user', content: 'Cansado.' }
      ],
      stageDetection: { stage: '', confidence: 0.1, metrics: {}, reason: '' },
      currentStage: 'sdr',
    };
    const result = evaluateConversationGuard(context);
    expect(result.issues).toContain('stagnant_stage');
  });

  it('bloqueia resposta quando falta conteúdo do usuário', () => {
    const context = {
      message: '',
      chatHistory: [
        { role: 'assistant', content: 'Como posso te ajudar?' },
        { role: 'user', content: '' }
      ],
      stageDetection: { stage: 'sdr', confidence: 0.8, metrics: {}, reason: '' },
      currentStage: 'sdr',
    };
    const result = evaluateConversationGuard(context);
    expect(result.issues).toContain('missing_user_response');
    expect(result.blockReply).toBe(true);
  });

  it('não aciona guardas em fluxo normal', () => {
    const context = {
      message: 'Quero melhorar minha alimentação.',
      chatHistory: [
        { role: 'assistant', content: 'Qual seu objetivo principal?' },
        { role: 'user', content: 'Quero perder peso.' }
      ],
      stageDetection: { stage: 'sdr', confidence: 0.9, metrics: {}, reason: '' },
      currentStage: 'sdr',
    };
    const result = evaluateConversationGuard(context);
    expect(result.issues.length).toBe(0);
    expect(result.forceStage).toBeUndefined();
    expect(result.blockReply).toBeUndefined();
  });
});
