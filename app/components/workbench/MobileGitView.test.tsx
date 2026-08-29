// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MobileGitView } from './MobileGitView';

const mocks = vi.hoisted(() => ({
  ready: true,
  initializationError: null as string | null,
  getStatus: vi.fn(),
  fetchRemote: vi.fn(),
  pull: vi.fn(),
  commitAll: vi.fn(),
  push: vi.fn(),
  createBranch: vi.fn(),
  switchBranch: vi.fn(),
  navigate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@remix-run/react', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('~/lib/hooks/useGitWorkspace', () => ({
  useGitWorkspace: () => ({
    ready: mocks.ready,
    initializationError: mocks.initializationError,
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
    connection: {
      token: 'test-token',
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

const cleanStatus = {
  isRepository: true,
  branch: 'main',
  remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
  changes: [],
  ahead: 0,
  behind: 0,
  syncState: 'synced' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ready = true;
  mocks.initializationError = null;
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.getStatus.mockResolvedValue({
    ...cleanStatus,
    changes: [{ path: 'app.ts', status: 'modified', staged: false }],
    ahead: 1,
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

  it('shows the repository picker before WebContainer finishes booting', async () => {
    mocks.ready = false;

    render(<MobileGitView />);

    expect(await screen.findByText('Choose a GitHub repository')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import test repository' })).toBeEnabled();
    expect(screen.queryByText('Loading Git workspace...')).not.toBeInTheDocument();
  });

  it('shows a runtime warning instead of spinning forever when WebContainer boot fails', async () => {
    mocks.ready = false;
    mocks.initializationError = 'WebContainer failed to start';

    render(<MobileGitView />);

    expect(await screen.findByText('Choose a GitHub repository')).toBeInTheDocument();
    expect(screen.getByText(/runtime could not start/i)).toBeInTheDocument();
  });

  it('commits all changes with the entered message', async () => {
    mocks.commitAll.mockResolvedValue({ oid: 'abc123', status: { ...cleanStatus, ahead: 2, syncState: 'ahead' } });

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

  it('creates and switches to a new branch', async () => {
    mocks.getStatus.mockResolvedValue(cleanStatus);
    mocks.createBranch.mockResolvedValue({ ...cleanStatus, branch: 'feature/git-workspace' });

    render(<MobileGitView />);
    await screen.findByText('Mkayvibe');

    fireEvent.change(screen.getByPlaceholderText('Branch name'), { target: { value: 'feature/git-workspace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create & Switch' }));

    await waitFor(() => expect(mocks.createBranch).toHaveBeenCalledWith('feature/git-workspace'));
  });

  it('switches to an existing branch', async () => {
    mocks.getStatus.mockResolvedValue(cleanStatus);
    mocks.switchBranch.mockResolvedValue({ ...cleanStatus, branch: 'develop' });

    render(<MobileGitView />);
    await screen.findByText('Mkayvibe');

    fireEvent.change(screen.getByPlaceholderText('Branch name'), { target: { value: 'develop' } });
    fireEvent.click(screen.getByRole('button', { name: 'Switch' }));

    await waitFor(() => expect(mocks.switchBranch).toHaveBeenCalledWith('develop'));
  });

  it('opens a GitHub pull request for the current branch', async () => {
    mocks.getStatus.mockResolvedValue({ ...cleanStatus, branch: 'feature/git-workspace', ahead: 1, syncState: 'ahead' });
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        pullRequest: {
          number: 42,
          htmlUrl: 'https://github.com/dudemkay/Mkayvibe/pull/42',
          title: 'Finish Git workspace',
          head: 'feature/git-workspace',
          base: 'main',
        },
      }),
    });

    render(<MobileGitView />);
    await screen.findByText('Mkayvibe');

    fireEvent.change(screen.getByPlaceholderText('PR title'), { target: { value: 'Finish Git workspace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open pull request' }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        '/api/github-pull-request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            owner: 'dudemkay',
            repo: 'Mkayvibe',
            head: 'feature/git-workspace',
            base: '',
            title: 'Finish Git workspace',
            body: '',
            token: 'test-token',
          }),
        }),
      );
    });
    expect(await screen.findByRole('link', { name: 'View PR #42' })).toHaveAttribute(
      'href',
      'https://github.com/dudemkay/Mkayvibe/pull/42',
    );
  });
});
