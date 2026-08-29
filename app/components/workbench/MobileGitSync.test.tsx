// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileGitView } from './MobileGitView';

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  fetchRemote: vi.fn(),
  pull: vi.fn(),
  commitAll: vi.fn(),
  push: vi.fn(),
  createBranch: vi.fn(),
  switchBranch: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@remix-run/react', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('~/lib/hooks/useGitWorkspace', () => ({
  useGitWorkspace: () => ({
    ready: true,
    getStatus: mocks.getStatus,
    fetchRemote: mocks.fetchRemote,
    pull: mocks.pull,
    commitAll: mocks.commitAll,
    push: mocks.push,
    createBranch: mocks.createBranch,
    switchBranch: mocks.switchBranch,
  }),
}));
vi.mock('~/lib/hooks/useGitHubConnection', () => ({
  useGitHubConnection: () => ({
    isConnected: true,
    connection: { token: '', user: { login: 'mkay', name: 'Mkay' } },
  }),
}));
vi.mock('~/components/@settings/tabs/github/components/GitHubRepositorySelector', () => ({
  GitHubRepositorySelector: () => null,
}));

describe('MobileGitView primary sync flow', () => {
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

    render(<MobileGitView />);
    await screen.findByText('app.ts');

    fireEvent.click(screen.getByRole('button', { name: 'Sync to GitHub' }));

    await waitFor(() => {
      expect(mocks.commitAll).toHaveBeenCalledWith('Update from Mkayvibe', {
        name: 'Mkay',
        email: 'mkay@users.noreply.github.com',
      });
      expect(mocks.push).toHaveBeenCalledTimes(1);
    });
  });
});
