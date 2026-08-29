// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitChatRouteBootstrap } from './GitChatRouteBootstrap.client';

const mocks = vi.hoisted(() => ({
  db: {},
  getMessages: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('~/lib/persistence', () => ({
  db: mocks.db,
  getMessages: mocks.getMessages,
  getSnapshot: mocks.getSnapshot,
}));
vi.mock('~/components/ui/LoadingOverlay', () => ({
  LoadingOverlay: () => <div>Loading</div>,
}));
vi.mock('./GitWorkspaceBootstrap.client', () => ({
  GitWorkspaceBootstrap: ({ chatId, children }: { chatId: string; children: ReactNode }) => (
    <div data-testid="workspace" data-chat-id={chatId}>
      {children}
    </div>
  ),
}));

describe('GitChatRouteBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads snapshots by the canonical chat id when the route uses a url id', async () => {
    mocks.getMessages.mockResolvedValue({
      id: '42',
      urlId: 'friendly-workspace',
      messages: [],
      timestamp: '2025-01-01T00:00:00.000Z',
      metadata: { gitUrl: 'https://github.com/dudemkay/Mkayvibe.git' },
    });
    mocks.getSnapshot.mockResolvedValue({ chatIndex: '', files: {} });

    render(
      <GitChatRouteBootstrap routeId="friendly-workspace">
        <div>Workspace ready</div>
      </GitChatRouteBootstrap>,
    );

    expect(await screen.findByText('Workspace ready')).toBeInTheDocument();
    expect(screen.getByTestId('workspace')).toHaveAttribute('data-chat-id', '42');
    expect(mocks.getMessages).toHaveBeenCalledWith(mocks.db, 'friendly-workspace');
    await waitFor(() => expect(mocks.getSnapshot).toHaveBeenCalledWith(mocks.db, '42'));
    expect(mocks.getSnapshot).not.toHaveBeenCalledWith(mocks.db, 'friendly-workspace');
  });
});
