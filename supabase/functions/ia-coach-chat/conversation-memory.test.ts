import { describe, expect, it } from 'vitest';

import { extractMemorySignals, mergeEntities, normalizeText, clean } from './conversation-memory';

describe('conversation-memory extraction', () => {
  it('detecta metas, dores e restrições com acentos mistos', () => {
    const text = 'Quero MUITO perder peso e tenho dificuldade em manter foco. Não como glúten e evito lactose.';
    const entities = extractMemorySignals(text);

    expect(entities.user_goals).toContain('muito perder peso e tenho dificuldade em manter foco');
    expect(entities.pain_points).toContain('manter foco');
    expect(entities.restrictions).toEqual(expect.arrayContaining(['gluten', 'lactose']));
  });

  it('deduplica preferências e atividades mesmo com variação de caixa', () => {
    const text = 'Prefiro treinos curtos e adoro TREINO funcional. Treino corrida e treino corrida novamente.';
    const entities = extractMemorySignals(text);

    expect(Object.keys(entities.preferences)).toEqual(['treinos curtos', 'treino funcional']);
    expect(entities.mentioned_activities).toEqual(['treino', 'corrida']);
  });

  it('identifica estado emocional', () => {
    const text = 'Hoje estou muito Ansioso e preciso de ajuda.';
    const entities = extractMemorySignals(text);
    expect(entities.emotional_state).toBe('ansioso');
  });
});

describe('conversation-memory helpers', () => {
  it('mergeEntities mantém valores únicos e preserva preferências', () => {
    const current = {
      user_goals: ['perder peso'],
      pain_points: ['falta de tempo'],
      mentioned_activities: ['treino'],
      restrictions: ['lactose'],
      preferences: { 'treinos curtos': 'preferred' },
      emotional_state: 'motivado',
    };
    const incoming = {
      user_goals: ['perder peso', 'ganhar força'],
      pain_points: ['falta de tempo', 'sono ruim'],
      mentioned_activities: ['treino', 'corrida'],
      restrictions: ['gluten'],
      preferences: { 'treino funcional': 'preferred' },
      emotional_state: undefined,
    };

    const merged = mergeEntities(current, incoming);
    expect(merged.user_goals).toEqual(expect.arrayContaining(['perder peso', 'ganhar forca']));
    expect(merged.pain_points).toEqual(expect.arrayContaining(['falta de tempo', 'sono ruim']));
    expect(merged.mentioned_activities).toEqual(['treino', 'corrida']);
    expect(merged.restrictions).toEqual(expect.arrayContaining(['lactose', 'gluten']));
    expect(merged.preferences).toMatchObject({
      'treinos curtos': 'preferred',
      'treino funcional': 'preferred',
    });
    expect(merged.emotional_state).toBe('motivado');
  });

  it('normalizeText remove acentos e padroniza caixa', () => {
    expect(normalizeText('Água Fria')).toBe('agua fria');
  });

  it('clean remove espaços extras', () => {
    expect(clean('  exemplo   de texto ')).toBe('exemplo de texto');
  });
});
