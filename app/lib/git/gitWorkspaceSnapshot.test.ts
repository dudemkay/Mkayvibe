import { describe, expect, it, vi } from 'vitest';
import { restoreGitWorkspaceSnapshot } from './gitWorkspaceSnapshot';
import type { Snapshot } from '~/lib/persistence/types';

describe('restoreGitWorkspaceSnapshot', () => {
  it('restores working files but never writes Git metadata', async () => {
    const mkdir = vi.fn().mockResolvedValue(undefined);
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const container = {
      workdir: '/home/project',
      fs: { mkdir, writeFile },
    } as any;
    const snapshot: Snapshot = {
      chatIndex: 'message-1',
      files: {
        '/home/project/src': { type: 'folder' },
        '/home/project/src/app.ts': { type: 'file', content: 'export const app = true;', isBinary: false },
        '/home/project/.git/config': { type: 'file', content: 'must not overwrite git', isBinary: false },
      },
    };

    await restoreGitWorkspaceSnapshot(container, snapshot);

    expect(mkdir).toHaveBeenCalledWith('src', { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('src/app.ts', 'export const app = true;', { encoding: 'utf8' });
    expect(writeFile).not.toHaveBeenCalledWith('.git/config', expect.anything(), expect.anything());
  });
});
