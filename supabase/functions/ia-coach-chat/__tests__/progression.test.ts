import { describe, it, expect } from 'vitest';
import { shouldForceProgression, ProgressionTracker } from '../progression';

describe('shouldForceProgression', () => {
  it('avança por tempo estagnado', () => {
    const tracker: ProgressionTracker = {
      stage: 'specialist',
      substage: 1,
      questionsAsked: ['dor', 'dor', 'dor'],
      topicsCovered: ['físico'],
      lastProgressAt: new Date(Date.now() - 6 * 60000).toISOString(), // 6 min atrás
      stagnationCount: 0,
    };
    expect(shouldForceProgression(tracker, 'Estou cansado', 'Qual sua dor?')).toBe(true);
  });

  it('avança por repetição de tópico', () => {
    const tracker: ProgressionTracker = {
      stage: 'specialist',
      substage: 1,
      questionsAsked: ['dor', 'dor', 'dor'],
      topicsCovered: ['físico'],
      lastProgressAt: new Date().toISOString(),
      stagnationCount: 0,
    };
    expect(shouldForceProgression(tracker, 'Tudo bem', 'Qual sua dor?')).toBe(true);
  });

  it('avança por cobertura de tópicos', () => {
    const tracker: ProgressionTracker = {
      stage: 'specialist',
      substage: 1,
      questionsAsked: ['dor', 'alimento', 'emoção', 'espiritual'],
      topicsCovered: ['físico', 'alimentar', 'emocional', 'espiritual'],
      lastProgressAt: new Date().toISOString(),
      stagnationCount: 0,
    };
    expect(shouldForceProgression(tracker, 'Ok', 'Qual sua dor?')).toBe(true);
  });

  it('avança por frustração do usuário', () => {
    const tracker: ProgressionTracker = {
      stage: 'specialist',
      substage: 1,
      questionsAsked: ['dor', 'alimento'],
      topicsCovered: ['físico', 'alimentar'],
      lastProgressAt: new Date().toISOString(),
      stagnationCount: 0,
    };
    expect(shouldForceProgression(tracker, 'Estou cansado de repetir', 'Qual sua dor?')).toBe(true);
  });

  it('não avança se nada se aplica', () => {
    const tracker: ProgressionTracker = {
      stage: 'specialist',
      substage: 1,
      questionsAsked: ['dor', 'alimento'],
      topicsCovered: ['físico', 'alimentar'],
      lastProgressAt: new Date().toISOString(),
      stagnationCount: 0,
    };
    expect(shouldForceProgression(tracker, 'Tudo certo', 'Qual sua dor?')).toBe(false);
  });
});
