import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('~/components/sidebar/Menu.client', () => ({ Menu: () => null }));
vi.mock('./Messages.client', () => ({ Messages: () => <div data-testid="messages" /> }));
vi.mock('./ChatBox', () => ({ ChatBox: () => <div data-testid="chat-box" /> }));
vi.mock('./GitCloneButton', () => ({ default: () => null }));
vi.mock('./StarterTemplates', () => ({ default: () => null }));
vi.mock('~/components/chat/chatExportAndImport/ImportButtons', () => ({ ImportButtons: () => null }));
vi.mock('~/components/workbench/Workbench.client', () => ({
  Workbench: ({ mobileView }: { mobileView?: string }) => <div data-testid={`workbench-${mobileView || 'desktop'}`} />,
}));
vi.mock('~/lib/stores/qrCodeStore', () => ({ expoUrlAtom: { get: () => '', subscribe: () => () => undefined } }));
vi.mock('~/lib/hooks', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    default: () => true,
    StickToBottom: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useStickToBottomContext: () => ({ isAtBottom: true, scrollToBottom: vi.fn() }),
  };
});

import { BaseChat } from './BaseChat';

describe('BaseChat mobile workspace composition', () => {
  it('renders five-tab mobile navigation after chat starts', () => {
    render(<BaseChat chatStarted messages={[]} />);

    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Git' })).toBeInTheDocument();
  });

  it('switches the workbench surface when a mobile tab is selected', () => {
    render(<BaseChat chatStarted messages={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(screen.getByTestId('workbench-files')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByTestId('workbench-preview')).toBeInTheDocument();
  });
});
