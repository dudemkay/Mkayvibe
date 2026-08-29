export const MKAYVIBE_TOGGLE_MENU_EVENT = 'mkayvibe:toggle-menu';

export function toggleNavigationMenu() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(MKAYVIBE_TOGGLE_MENU_EVENT));
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 1, clientY: 1, bubbles: true }));
}
