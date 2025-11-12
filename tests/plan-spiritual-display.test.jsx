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

import { SpiritualPlanDisplay } from '@/components/client/PlanTab.jsx';

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('SpiritualPlanDisplay', () => {
  it('renders without crashing and shows header content', () => {
    const planData = {
      plan_data: {
        title: 'Plano de Crescimento Espiritual',
        description: 'Práticas semanais e diárias',
        focus_areas: ['Gratidão'],
        daily_practices: [
          { time: 'Manhã', activity: 'Meditação guiada' }
        ],
        weekly_reflection_prompts: ['Como foi sua semana?'],
        monthly_goals: ['Praticar 8 sessões']
      }
    };

    const { container } = render(
      <Wrapper>
        <SpiritualPlanDisplay planData={planData} />
      </Wrapper>
    );

    expect(container.textContent).toContain('Plano de Crescimento Espiritual');
  });
});
