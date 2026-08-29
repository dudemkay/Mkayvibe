// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@nanostores/react', () => ({ useStore: () => ({ started: true }) }));
vi.mock('remix-utils/client-only', () => ({ ClientOnly: ({ children }: any) => children() }));
vi.mock('~/lib/persistence/ChatDescription.client', () => ({ ChatDescription: () => <span>Current project</span> }));
vi.mock('./HeaderActionButtons.client', () => ({ HeaderActionButtons: () => <div data-testid="desktop-header-actions" /> }));
vi.mock('~/lib/ui/navigationEvents', () => ({ toggleNavigationMenu: vi.fn() }));

import { Header } from './Header';

describe('Header mobile layout', () => {
  it('keeps desktop action controls out of the mobile-width header', () => {
    render(<Header />);

    const desktopActions = screen.getByTestId('desktop-header-actions');
    expect(desktopActions.parentElement).toHaveClass('hidden');
    expect(desktopActions.parentElement).toHaveClass('lg:block');
  });

  it('prioritizes the current chat title over the brand wordmark on narrow screens', () => {
    render(<Header />);

    expect(screen.getByText('Current project')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mkayvibe/i })).toHaveClass('hidden');
    expect(screen.getByRole('link', { name: /Mkayvibe/i })).toHaveClass('sm:flex');
  });
});
