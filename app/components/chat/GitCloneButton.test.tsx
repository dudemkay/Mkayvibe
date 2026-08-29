// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GitCloneButton from './GitCloneButton';

const mocks = vi.hoisted(() => ({
  gitClone: vi.fn().mockResolvedValue({
    workdir: '/home/project',
    data: { 'src/app.ts': { data: 'export const app = true;', encoding: 'utf8' } },
  }),
}));

vi.mock('~/lib/hooks/useGit', () => ({
  useGit: () => ({ ready: true, gitClone: mocks.gitClone }),
}));
vi.mock('~/components/@settings/tabs/github/components/GitHubRepositorySelector', () => ({
  GitHubRepositorySelector: ({ onClone }: { onClone?: (repoUrl: string, branch?: string) => void }) => (
    <button onClick={() => onClone?.('https://github.com/dudemkay/Mkayvibe.git', 'feature/mobile')}>
      Choose test repository
    </button>
  ),
}));
vi.mock('~/components/@settings/tabs/gitlab/components/GitLabRepositorySelector', () => ({
  GitLabRepositorySelector: () => null,
}));

describe('GitCloneButton', () => {
  it('creates a metadata-only Git workspace instead of replaying repository files', async () => {
    const importChat = vi.fn().mockResolvedValue(undefined);

    render(<GitCloneButton importChat={importChat} />);
    fireEvent.click(screen.getByRole('button', { name: /Clone a repo/ }));
    fireEvent.click(screen.getByRole('button', { name: /GitHub Clone from GitHub repositories/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose test repository' }));

    await waitFor(() => expect(importChat).toHaveBeenCalledTimes(1));
    const [description, messages, metadata] = importChat.mock.calls[0];

    expect(description).toBe('Git Project:Mkayvibe');
    expect(messages).toHaveLength(1);
    expect(messages[0].content).not.toContain('<boltArtifact');
    expect(messages[0].content).not.toContain('<boltAction');
    expect(metadata).toEqual({
      gitUrl: 'https://github.com/dudemkay/Mkayvibe.git',
      gitBranch: 'feature/mobile',
    });
    expect(mocks.gitClone).not.toHaveBeenCalled();
  });
});
