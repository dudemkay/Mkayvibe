// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MobileGitView } from './MobileGitView';

const gitMocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  fetchRemote: vi.fn(),
  pull: vi.fn(),
  commitAll: vi.fn(),
  push: vi.fn(),
}));

vi.mock('~/lib/hooks/useGitWorkspace', () => ({
  useGitWorkspace: () => ({
    ready: true,
    ...gitMocks,
  }),
}));

vi.mock('~/lib/hooks/useGitHubConnection', () => ({
  useGitHubConnection: () => ({
    connection: {
      user: {
        login: 'mkay',
        name: 'Mkay',
        email: 'mkay@example.com',
      },
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  gitMocks.getStatus.mockResolvedValue({
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
    gitMocks.commitAll.mockResolvedValue({
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
      expect(gitMocks.commitAll).toHaveBeenCalledWith('Save mobile Git work', {
        name: 'Mkay',
        email: 'mkay@example.com',
      });
    });
  });

  it('shows an import hint when there is no repository loaded', async () => {
    gitMocks.getStatus.mockResolvedValue({
      isRepository: false,
      branch: null,
      remoteUrl: null,
      changes: [],
      ahead: 0,
      behind: 0,
      syncState: 'unknown',
    });

    render(<MobileGitView />);

    expect(await screen.findByText('No Git repository loaded')).toBeInTheDocument();
    expect(screen.getByText(/import or clone a GitHub repository/i)).toBeInTheDocument();
  });
});
