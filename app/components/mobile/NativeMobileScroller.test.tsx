// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NativeMobileScroller } from './NativeMobileScroller.client';

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

describe('NativeMobileScroller', () => {
  it('provides one bounded native vertical scroll region for conversation content', () => {
    render(
      <NativeMobileScroller>
        <div>Long conversation</div>
      </NativeMobileScroller>,
    );

    const scroller = screen.getByTestId('native-mobile-message-scroll');
    expect(scroller).toHaveClass('overflow-y-auto');
    expect(scroller).toHaveClass('min-h-0');
    expect(scroller).not.toHaveClass('overflow-y-hidden');
  });
});
