import { describe, it, expect } from 'vitest';
import { extractMemorySignals } from '../conversation-memory';

describe('Memória de conversa - extração de entidades', () => {
  it('extrai objetivos, dores e preferências', () => {
    const texto = 'Quero perder peso, ganhar massa e melhorar minha alimentação. Tenho dificuldade com doces. Prefiro salada e adoro corrida.';
    const entidades = extractMemorySignals(texto);
    expect(entidades.user_goals).toContain('perder peso');
    expect(entidades.user_goals).toContain('ganhar massa');
  expect(entidades.user_goals).toContain('melhorar minha alimentacao');
  expect(entidades.pain_points).toContain('com doces');
    expect(entidades.preferences['salada']).toBe('preferred');
    expect(entidades.mentioned_activities).toContain('corrida');
  });

  it('normaliza e não duplica entidades', () => {
    const texto = 'Quero perder peso. Quero perder peso. Prefiro salada.';
    const entidades = extractMemorySignals(texto);
    expect(entidades.user_goals.filter(g => g === 'perder peso').length).toBe(1);
    expect(entidades.preferences['salada']).toBe('preferred');
  });
});
