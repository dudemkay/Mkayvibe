// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileGitWorkspaceView } from './MobileGitWorkspaceView';

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  pull: vi.fn(),
  commitAll: vi.fn(),
  push: vi.fn(),
}));

vi.mock('~/lib/hooks/useGitWorkspace', () => ({
  useGitWorkspace: () => ({
    ready: true,
    getStatus: mocks.getStatus,
    pull: mocks.pull,
    commitAll: mocks.commitAll,
    push: mocks.push,
  }),
}));
vi.mock('~/lib/hooks/useGitHubConnection', () => ({
  useGitHubConnection: () => ({
    isConnected: true,
    connection: { token: '', user: { login: 'mkay', name: 'Mkay' } },
  }),
}));
vi.mock('./MobileGitView', () => ({
  MobileGitView: () => <div>Advanced Git tools</div>,
}));

describe('MobileGitWorkspaceView primary sync flow', () => {
  it('commits current changes and pushes them with one Sync to GitHub action', async () => {
    mocks.getStatus.mockResolvedValue({
      isRepository: true,
      branch: 'main',
      remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
      changes: [{ path: 'app.ts', status: 'modified', staged: false }],
      ahead: 0,
      behind: 0,
      syncState: 'unknown',
    });
    mocks.commitAll.mockResolvedValue({
      oid: 'abc123',
      status: {
        isRepository: true,
        branch: 'main',
        remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
        changes: [],
        ahead: 1,
        behind: 0,
        syncState: 'ahead',
      },
    });
    mocks.push.mockResolvedValue({
      isRepository: true,
      branch: 'main',
      remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
      changes: [],
      ahead: 0,
      behind: 0,
      syncState: 'synced',
    });

    render(<MobileGitWorkspaceView />);
    expect(await screen.findByText('1 change')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sync to GitHub' }));

    await waitFor(() => {
      expect(mocks.commitAll).toHaveBeenCalledWith('Update from Mkayvibe', {
        name: 'Mkay',
        email: 'mkay@users.noreply.github.com',
      });
      expect(mocks.push).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps detailed Git operations behind Advanced Git', async () => {
    mocks.getStatus.mockResolvedValue({
      isRepository: true,
      branch: 'main',
      remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
      changes: [],
      ahead: 0,
      behind: 0,
      syncState: 'synced',
    });

    render(<MobileGitWorkspaceView />);
    await screen.findByText('Up to date');

    fireEvent.click(screen.getByRole('button', { name: 'Advanced Git' }));
    expect(screen.getByText('Advanced Git tools')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Sync' })).toBeInTheDocument();
  });
});
