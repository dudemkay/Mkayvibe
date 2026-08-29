// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('~/components/sidebar/Menu.client', () => ({ Menu: () => null }));
vi.mock('./Messages.client', () => ({ Messages: () => <div data-testid="messages" /> }));
vi.mock('./ChatBox', () => ({ ChatBox: () => <div data-testid="chat-box" /> }));
vi.mock('./GitCloneButton', () => ({ default: () => null }));
vi.mock('./StarterTemplates', () => ({ default: () => null }));
vi.mock('~/components/chat/chatExportAndImport/ImportButtons', () => ({ ImportButtons: () => null }));
vi.mock('./APIKeyManager', () => ({ getApiKeysFromCookies: () => ({}) }));
vi.mock('~/components/workbench/Workbench.client', () => ({
  Workbench: ({ mobileView }: { mobileView?: string }) => <div data-testid={`workbench-${mobileView || 'desktop'}`} />,
}));
vi.mock('~/lib/stores/qrCodeStore', async () => {
  const { atom } = await vi.importActual<typeof import('nanostores')>('nanostores');
  return { expoUrlAtom: atom('') };
});
vi.mock('~/lib/hooks', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  const StickToBottom = Object.assign(
    ({ children }: { children: ReactNode }) => <div>{children}</div>,
    {
      Content: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    },
  );

  return {
    ...original,
    default: () => true,
    StickToBottom,
    useStickToBottomContext: () => ({ isAtBottom: true, scrollToBottom: vi.fn() }),
  };
});

import { BaseChat } from './BaseChat';

describe('BaseChat mobile workspace composition', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
  });

  it('renders the five-tab navigation on the initial mobile screen', () => {
    render(<BaseChat chatStarted={false} messages={[]} />);

    expect(screen.getByRole('button', { name: 'Chat' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Files' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Code' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Git' })).toBeDisabled();
  });

  it('enables all five mobile navigation destinations after chat starts', () => {
    render(<BaseChat chatStarted messages={[]} />);

    expect(screen.getByRole('button', { name: 'Chat' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Files' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Code' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Git' })).toBeEnabled();
  });

  it('switches the workbench surface when a mobile tab is selected', async () => {
    render(<BaseChat chatStarted messages={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(await screen.findByTestId('workbench-files')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByTestId('workbench-preview')).toBeInTheDocument();
  });
});
