import { describe, it, expect } from 'vitest';
import { shouldForceProgression, ProgressionTracker } from '../progression';

describe('Jornada IA Coach - anti-loop', () => {
  it('não repete perguntas e avança estágio', () => {
    // Simula uma sequência de interações
    let tracker: ProgressionTracker = {
      stage: 'specialist',
      substage: 1,
      questionsAsked: ['dor', 'dor', 'dor'],
      topicsCovered: ['físico'],
      lastProgressAt: new Date(Date.now() - 6 * 60000).toISOString(),
      stagnationCount: 0,
    };
    // Usuário responde com frustração
    const userMessage = 'Já respondi isso, não quero repetir';
    const aiReply = 'Qual sua dor?';
    // Deve forçar avanço
    expect(shouldForceProgression(tracker, userMessage, aiReply)).toBe(true);

    // Avança substage e reseta perguntas
    tracker = {
      ...tracker,
      substage: 2,
      questionsAsked: ['alimento'],
      topicsCovered: ['físico', 'alimentar'],
      lastProgressAt: new Date().toISOString(),
    };
    // Usuário responde normalmente
    expect(shouldForceProgression(tracker, 'Gosto de salada', 'Qual sua refeição favorita?')).toBe(false);
  });
});
