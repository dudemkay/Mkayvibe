// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('~/components/sidebar/Menu.client', () => ({ Menu: () => null }));
vi.mock('./Messages.client', () => ({ Messages: () => <div data-testid="messages" /> }));
vi.mock('./ChatBox', () => ({
  ChatBox: ({ isModelSettingsCollapsed }: { isModelSettingsCollapsed: boolean }) => (
    <div data-testid="chat-box" data-model-settings-collapsed={String(isModelSettingsCollapsed)} />
  ),
}));
vi.mock('./GitCloneButton', () => ({ default: () => <button type="button">Import GitHub</button> }));
vi.mock('./StarterTemplates', () => ({ default: () => null }));
vi.mock('~/components/chat/chatExportAndImport/ImportButtons', () => ({
  ImportButtons: () => <button type="button">Import chat</button>,
}));
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
    ({ children, className }: { children: ReactNode; className?: string }) => (
      <div data-testid="mobile-chat-scroll" className={className}>
        {children}
      </div>
    ),
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

  it('renders the chat composer immediately before a chat exists', () => {
    render(<BaseChat chatStarted={false} messages={[]} />);

    expect(screen.getByTestId('chat-box')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-chat-scroll')).toBeInTheDocument();
  });

  it('starts with model settings collapsed on mobile', () => {
    render(<BaseChat chatStarted={false} messages={[]} />);

    expect(screen.getByTestId('chat-box')).toHaveAttribute('data-model-settings-collapsed', 'true');
  });

  it('renders all five navigation destinations enabled on the initial mobile screen', () => {
    render(<BaseChat chatStarted={false} messages={[]} />);

    expect(screen.getByRole('button', { name: 'Chat' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Files' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Code' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Git' })).toBeEnabled();
  });

  it('marks chat hidden when another mobile workspace tab is selected', () => {
    render(<BaseChat chatStarted messages={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));

    const chatBox = screen.getByTestId('chat-box');
    const hiddenChatSurface = chatBox.closest('.hidden');
    expect(hiddenChatSurface).not.toBeNull();
    expect(screen.getByTestId('workbench-files')).toBeInTheDocument();
  });

  it('switches between workbench surfaces without changing the mobile navigation shell', () => {
    render(<BaseChat chatStarted messages={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(screen.getByTestId('workbench-files')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByTestId('workbench-preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveAttribute('aria-current', 'page');
  });
});
