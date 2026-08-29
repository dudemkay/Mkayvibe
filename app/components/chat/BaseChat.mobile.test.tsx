// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('~/components/sidebar/Menu.client', () => ({ Menu: () => null }));
vi.mock('./Messages.client', () => ({ Messages: () => <div data-testid="messages" /> }));
vi.mock('./ChatBox', () => ({ ChatBox: () => <div data-testid="desktop-chat-box" /> }));
vi.mock('~/components/mobile/NativeMobileChatBox', () => ({
  NativeMobileChatBox: ({ isModelSettingsCollapsed }: { isModelSettingsCollapsed: boolean }) => (
    <div data-testid="native-mobile-chat-box" data-model-settings-collapsed={String(isModelSettingsCollapsed)} />
  ),
}));
vi.mock('~/components/mobile/NativeMobileWorkspace', () => ({
  NativeMobileWorkspace: ({ view }: { view: string }) => <div data-testid={`native-mobile-workspace-${view}`} />,
}));
vi.mock('./GitCloneButton', () => ({ default: () => <button type="button">Clone a repo</button> }));
vi.mock('./StarterTemplates', () => ({ default: () => <div data-testid="desktop-starters" /> }));
vi.mock('~/components/chat/ExamplePrompts', () => ({ ExamplePrompts: () => <div data-testid="desktop-prompts" /> }));
vi.mock('~/components/chat/chatExportAndImport/ImportButtons', () => ({
  ImportButtons: () => <button type="button">Import chat</button>,
}));
vi.mock('./APIKeyManager', () => ({ getApiKeysFromCookies: () => ({}) }));
vi.mock('~/components/workbench/Workbench.client', () => ({ Workbench: () => <div data-testid="desktop-workbench" /> }));
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

describe('BaseChat native mobile shell', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
  });

  it('mounts only the native chat surface on first load', () => {
    render(<BaseChat chatStarted={false} messages={[]} />);

    expect(screen.getByTestId('native-mobile-shell')).toBeInTheDocument();
    expect(screen.getByTestId('native-mobile-chat-surface')).toBeInTheDocument();
    expect(screen.getByTestId('native-mobile-chat-box')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-chat-box')).not.toBeInTheDocument();
    expect(screen.queryByTestId('desktop-workbench')).not.toBeInTheDocument();
    expect(screen.queryByTestId('desktop-starters')).not.toBeInTheDocument();
    expect(screen.queryByTestId('desktop-prompts')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Import chat' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clone a repo' })).not.toBeInTheDocument();
  });

  it('starts with model settings collapsed on mobile', () => {
    render(<BaseChat chatStarted={false} messages={[]} />);

    expect(screen.getByTestId('native-mobile-chat-box')).toHaveAttribute('data-model-settings-collapsed', 'true');
  });

  it('unmounts Chat when another mobile tab is selected', () => {
    render(<BaseChat chatStarted messages={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));

    expect(screen.queryByTestId('native-mobile-chat-surface')).not.toBeInTheDocument();
    expect(screen.queryByTestId('native-mobile-chat-box')).not.toBeInTheDocument();
    expect(screen.getByTestId('native-mobile-workspace-files')).toBeInTheDocument();
  });

  it('mounts only one workspace surface at a time and can return to Chat', () => {
    render(<BaseChat chatStarted messages={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(screen.getByTestId('native-mobile-workspace-files')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.queryByTestId('native-mobile-workspace-files')).not.toBeInTheDocument();
    expect(screen.getByTestId('native-mobile-workspace-preview')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.queryByTestId('native-mobile-workspace-preview')).not.toBeInTheDocument();
    expect(screen.getByTestId('native-mobile-chat-surface')).toBeInTheDocument();
  });

  it('keeps all five mobile destinations available', () => {
    render(<BaseChat chatStarted={false} messages={[]} />);

    for (const label of ['Chat', 'Files', 'Code', 'Preview', 'Git']) {
      expect(screen.getByRole('button', { name: label })).toBeEnabled();
    }
  });
});
