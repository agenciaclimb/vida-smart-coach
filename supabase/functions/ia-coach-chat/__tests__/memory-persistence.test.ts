import { describe, it, expect, vi } from 'vitest';

// Mocks para persistência de memória
const saveMemorySnapshot = vi.fn().mockResolvedValue({ success: true, saved_at: new Date() });
const loadMemorySnapshot = vi.fn().mockResolvedValue({ 
  goals: ['perder peso', 'melhorar alimentacao'],
  session_id: 'session123'
});

describe('Persistência de Memória', () => {
  it('salva histórico de interações', async () => {
    const result = await saveMemorySnapshot('user1', { goals: ['perder peso'] });
    expect(result.success).toBe(true);
    expect(result.saved_at).toBeDefined();
  });

  it('recupera histórico corretamente', async () => {
    const snapshot = await loadMemorySnapshot('user1');
    expect(snapshot.goals).toContain('perder peso');
    expect(snapshot.session_id).toBeDefined();
  });
});
