// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GitWorkspaceBootstrap } from './GitWorkspaceBootstrap.client';

const mocks = vi.hoisted(() => ({
  gitClone: vi.fn(),
  getStatus: vi.fn(),
  getSnapshot: vi.fn(),
  setSnapshot: vi.fn(),
  readdir: vi.fn(),
  rm: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  subscribe: vi.fn(() => () => undefined),
}));

vi.mock('~/lib/hooks/useGit', () => ({
  useGit: () => ({ ready: true, error: null, gitClone: mocks.gitClone }),
}));
vi.mock('~/lib/hooks/useGitWorkspace', () => ({
  useGitWorkspace: () => ({ ready: true, getStatus: mocks.getStatus }),
}));
vi.mock('~/lib/persistence', () => ({
  db: {},
  getSnapshot: mocks.getSnapshot,
  setSnapshot: mocks.setSnapshot,
}));
vi.mock('~/lib/webcontainer', () => ({
  webcontainer: Promise.resolve({
    workdir: '/home/project',
    fs: {
      readdir: mocks.readdir,
      rm: mocks.rm,
      mkdir: mocks.mkdir,
      writeFile: mocks.writeFile,
    },
  }),
}));
vi.mock('~/lib/stores/workbench', () => ({
  workbenchStore: { files: { subscribe: mocks.subscribe } },
}));

describe('GitWorkspaceBootstrap', () => {
  it('clones the metadata repository and restores working files before showing the workspace', async () => {
    mocks.getStatus
      .mockResolvedValueOnce({ isRepository: false, branch: null, remoteUrl: null })
      .mockResolvedValueOnce({
        isRepository: true,
        branch: 'main',
        remoteUrl: 'https://github.com/dudemkay/Mkayvibe.git',
      });
    mocks.readdir.mockResolvedValue([]);
    mocks.gitClone.mockResolvedValue({ workdir: '/home/project', data: {} });
    mocks.getSnapshot.mockResolvedValue({
      chatIndex: '',
      files: {
        '/home/project/src/app.ts': { type: 'file', content: 'saved edit', isBinary: false },
      },
    });

    render(
      <GitWorkspaceBootstrap
        metadata={{ gitUrl: 'https://github.com/dudemkay/Mkayvibe.git', gitBranch: 'main' }}
        chatId="12"
      >
        <div>Workspace ready</div>
      </GitWorkspaceBootstrap>,
    );

    expect(screen.queryByText('Workspace ready')).not.toBeInTheDocument();

    await waitFor(() => expect(mocks.gitClone).toHaveBeenCalledWith('https://github.com/dudemkay/Mkayvibe.git#main'));
    await waitFor(() => expect(mocks.writeFile).toHaveBeenCalledWith('src/app.ts', 'saved edit', { encoding: 'utf8' }));
    expect(await screen.findByText('Workspace ready')).toBeInTheDocument();
  });

  it('does not clone for chats without Git metadata', () => {
    render(
      <GitWorkspaceBootstrap chatId="12">
        <div>Regular chat</div>
      </GitWorkspaceBootstrap>,
    );

    expect(screen.getByText('Regular chat')).toBeInTheDocument();
    expect(mocks.gitClone).not.toHaveBeenCalled();
  });
});
