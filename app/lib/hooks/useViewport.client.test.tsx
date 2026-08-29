// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useViewport from './useViewport';

function ViewportProbe() {
  const isSmallViewport = useViewport(1024);
  return <span>{isSmallViewport ? 'small' : 'large'}</span>;
}

describe('useViewport browser detection', () => {
  it('detects a phone viewport on the first client render', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });

    render(<ViewportProbe />);

    expect(screen.getByText('small')).toBeInTheDocument();
  });

  it('detects a desktop viewport on the first client render', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });

    render(<ViewportProbe />);

    expect(screen.getByText('large')).toBeInTheDocument();
  });
});
