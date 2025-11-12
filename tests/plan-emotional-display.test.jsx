import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/hooks/usePlanCompletions', () => ({
  usePlanCompletions: () => ({
    toggleCompletion: vi.fn(),
    isItemCompleted: () => false,
    isProcessing: () => false,
    loading: false,
    getStats: () => ({ total: 0 })
  })
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user' } })
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ insert: () => ({ select: () => ({ data: [{ id: 1 }], error: null }) }) })
  }
}));

import { EmotionalPlanDisplay } from '@/components/client/PlanTab.jsx';

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('EmotionalPlanDisplay', () => {
  it('renders without crashing and shows header content', () => {
    const planData = {
      plan_data: {
        title: 'Plano de Bem-Estar Emocional',
        description: 'Rotinas e técnicas para saúde emocional',
        focus_areas: ['Foco', 'Respiração'],
        daily_routines: [
          { time: 'Manhã', routine: 'Respiração consciente' },
          { time: 'Noite', routine: 'Diário de gratidão' }
        ],
        techniques: [
          { name: 'Respiração 4-7-8', description: 'Técnica para acalmar.' }
        ],
        weekly_goals: ['2 sessões de mindfulness']
      }
    };

    const { container } = render(
      <Wrapper>
        <EmotionalPlanDisplay planData={planData} />
      </Wrapper>
    );

    expect(container.textContent).toContain('Plano de Bem-Estar Emocional');
  });
});
