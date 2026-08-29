import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import useViewport from './useViewport';

function ViewportProbe() {
  const isSmallViewport = useViewport(1024);
  return <span>{isSmallViewport ? 'small' : 'large'}</span>;
}

describe('useViewport', () => {
  it('can render during SSR when window is unavailable', () => {
    expect(() => renderToString(<ViewportProbe />)).not.toThrow();
  });
});
