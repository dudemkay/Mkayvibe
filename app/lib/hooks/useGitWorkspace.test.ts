import { describe, expect, it, vi } from 'vitest';
import { createGitWorkspaceFs } from './useGitWorkspace';

describe('createGitWorkspaceFs', () => {
  it('reports the WebContainer workspace root as a directory', async () => {
    const readdir = vi.fn();
    const container = {
      workdir: '/home/project',
      fs: {
        readdir,
      },
    } as any;
    const record = { current: {} } as any;
    const fs = createGitWorkspaceFs(container, record);

    const root = await fs.promises.lstat('/home/project');

    expect(root.isDirectory()).toBe(true);
    expect(root.isFile()).toBe(false);
    expect(readdir).not.toHaveBeenCalled();
  });
});
