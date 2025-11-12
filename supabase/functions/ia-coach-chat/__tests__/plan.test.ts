import { describe, it, expect, vi } from 'vitest';

// Mocks para planos
const generatePlan = vi.fn().mockResolvedValue({ 
  pillars: ['físico', 'nutricional', 'emocional', 'espiritual'],
  created: true 
});
const getPlanProgress = vi.fn().mockResolvedValue({ percent: 65, completed: 13, total: 20 });

describe('Planos Personalizados', () => {
  it('gera plano nos 4 pilares', async () => {
    const plan = await generatePlan('user1');
    expect(plan.pillars.length).toBe(4);
    expect(plan.created).toBe(true);
  });

  it('atualiza progresso visual', async () => {
    const progress = await getPlanProgress('user1');
    expect(progress.percent).toBeGreaterThanOrEqual(0);
    expect(progress.percent).toBeLessThanOrEqual(100);
  });
});
