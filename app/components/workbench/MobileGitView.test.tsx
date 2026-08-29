// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MobileGitView } from './MobileGitView';

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  fetchRemote: vi.fn(),
  pull: vi.fn(),
  commitAll: vi.fn(),
  push: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@remix-run/react', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('~/lib/hooks/useGitWorkspace', () => ({
  useGitWorkspace: () => ({
    ready: true,
    getStatus: mocks.getStatus,
    fetchRemote: mocks.fetchRemote,
    pull: mocks.pull,
    commitAll: mocks.commitAll,
    push: mocks.push,
  }),
}));

vi.mock('~/lib/hooks/useGitHubConnection', () => ({
  useGitHubConnection: () => ({
    isConnected: true,
    connection: {
      user: {
        login: 'mkay',
        name: 'Mkay',
      },
    },
  }),
}));

vi.mock('~/components/@settings/tabs/github/components/GitHubRepositorySelector', () => ({
  GitHubRepositorySelector: ({ onClone }: { onClone?: (repoUrl: string, branch?: string) => void }) => (
    <button onClick={() => onClone?.('https://github.com/dudemkay/Mkayvibe.git', 'feature/mobile git')}>
      Import test repository
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getStatus.mockResolvedValue({
    isRepository: true,
    branch: 'main',
    remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
    changes: [{ path: 'app.ts', status: 'modified', staged: false }],
    ahead: 1,
    behind: 0,
    syncState: 'ahead',
  });
});

describe('MobileGitView', () => {
  it('shows repository, branch, sync state, and changed files', async () => {
    render(<MobileGitView />);

    expect(await screen.findByText('Mkayvibe')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('1 ahead')).toBeInTheDocument();
    expect(screen.getByText('app.ts')).toBeInTheDocument();
    expect(screen.getByText('Modified')).toBeInTheDocument();
  });

  it('commits all changes with the entered message', async () => {
    mocks.commitAll.mockResolvedValue({
      oid: 'abc123',
      status: {
        isRepository: true,
        branch: 'main',
        remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
        changes: [],
        ahead: 2,
        behind: 0,
        syncState: 'ahead',
      },
    });

    render(<MobileGitView />);
    await screen.findByText('app.ts');

    fireEvent.change(screen.getByPlaceholderText('Commit message'), {
      target: { value: 'Save mobile Git work' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(mocks.commitAll).toHaveBeenCalledWith('Save mobile Git work', {
        name: 'Mkay',
        email: 'mkay@users.noreply.github.com',
      });
    });
  });

  it('lets a connected user choose a repository and branch to import', async () => {
    mocks.getStatus.mockResolvedValue({
      isRepository: false,
      branch: null,
      remoteUrl: null,
      changes: [],
      ahead: 0,
      behind: 0,
      syncState: 'unknown',
    });

    render(<MobileGitView />);

    expect(await screen.findByText('Choose a GitHub repository')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Import test repository' }));

    expect(mocks.navigate).toHaveBeenCalledWith(
      '/git?url=https%3A%2F%2Fgithub.com%2Fdudemkay%2FMkayvibe.git%23feature%2Fmobile%20git',
    );
  });
});
