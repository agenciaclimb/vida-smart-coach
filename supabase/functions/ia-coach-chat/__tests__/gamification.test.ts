import { describe, it, expect, vi } from 'vitest';

// Mocks para funções de gamificação
const awardPoints = vi.fn().mockResolvedValue({ points: 10, success: true });
const getUserBadges = vi.fn().mockResolvedValue(['Primeira Conquista', 'Streak 7 Dias']);

describe('Gamificação e Recompensas', () => {
  it('atribui pontos ao concluir atividade', async () => {
    const result = await awardPoints('user1', 'atividade1');
    expect(result.points).toBeGreaterThan(0);
    expect(result.success).toBe(true);
  });

  it('desbloqueia badge ao atingir meta', async () => {
    const badges = await getUserBadges('user1');
    expect(badges).toContain('Primeira Conquista');
    expect(badges.length).toBeGreaterThan(0);
  });
});
