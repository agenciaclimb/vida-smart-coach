import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedCounter from './AnimatedCounter';

describe('AnimatedCounter', () => {
  it('renders with numeric value', () => {
    render(<AnimatedCounter value={100} />);
    // Counter should eventually show 100
    expect(screen.getByText(/100/)).toBeDefined();
  });

  it('handles string numeric value', () => {
    render(<AnimatedCounter value="250" />);
    expect(screen.getByText(/250/)).toBeDefined();
  });

  it('handles invalid value gracefully', () => {
    render(<AnimatedCounter value="invalid" />);
    expect(screen.getByText(/0/)).toBeDefined();
  });

  it('renders with suffix', () => {
    render(<AnimatedCounter value={500} suffix="pts" />);
    expect(screen.getByText(/pts/)).toBeDefined();
  });

  it('handles null/undefined values', () => {
    render(<AnimatedCounter value={null} />);
    expect(screen.getByText(/0/)).toBeDefined();
  });

  it('renders without animation', () => {
    render(<AnimatedCounter value={999} animate={false} />);
    expect(screen.getByText(/999/)).toBeDefined();
  });
});
