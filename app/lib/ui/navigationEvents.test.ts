// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { MKAYVIBE_TOGGLE_MENU_EVENT, toggleNavigationMenu } from './navigationEvents';

describe('navigation events', () => {
  it('dispatches the Mkayvibe menu toggle event', () => {
    const listener = vi.fn();
    window.addEventListener(MKAYVIBE_TOGGLE_MENU_EVENT, listener);

    toggleNavigationMenu();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(MKAYVIBE_TOGGLE_MENU_EVENT, listener);
  });
});
