import type { WebContainer } from '@webcontainer/api';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import git, { type GitAuth, type PromiseFsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import Cookies from 'js-cookie';
import { webcontainer as webcontainerPromise } from '~/lib/webcontainer';
import { classifyGitStatusRow, type GitFileChange, type GitStatusMatrixRow } from '~/lib/git/gitStatus';

export type GitSyncState = 'unknown' | 'synced' | 'ahead' | 'behind' | 'diverged';

export interface GitWorkspaceStatus {
  isRepository: boolean;
  branch: string | null;
  remoteUrl: string | null;
  changes: GitFileChange[];
  ahead: number;
  behind: number;
  syncState: GitSyncState;
}

export interface GitCommitAuthor {
  name: string;
  email: string;
}

const EMPTY_STATUS: GitWorkspaceStatus = {
  isRepository: false,
  branch: null,
  remoteUrl: null,
  changes: [],
  ahead: 0,
  behind: 0,
  syncState: 'unknown',
};

const lookupSavedPassword = (url: string): GitAuth | null => {
  const domain = url.split('/')[2];
  const gitCreds = Cookies.get(`git:${domain}`);

  if (!gitCreds) {
    return null;
  }

  try {
    const { username, password } = JSON.parse(gitCreds);

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch {
    return null;
  }
};

const saveGitAuth = (url: string, auth: GitAuth) => {
  const domain = url.split('/')[2];
  Cookies.set(`git:${domain}`, JSON.stringify(auth));
};

function networkOptions(remoteUrl: string) {
  return {
    http,
    corsProxy: '/api/git-proxy',
    headers: {
      'User-Agent': 'bolt.diy',
    },
    onAuth: (url: string) => lookupSavedPassword(url) || lookupSavedPassword(remoteUrl) || { cancel: true },
    onAuthSuccess: (url: string, auth: GitAuth) => saveGitAuth(url, auth),
    onAuthFailure: (url: string) => {
      throw new Error(`GitHub authentication failed for ${url.split('/')[2]}. Reconnect GitHub in Settings and try again.`);
    },
  };
}

async function getAheadBehind(fs: PromiseFsClient, dir: string, branch: string) {
  try {
    const localRef = `refs/heads/${branch}`;
    const remoteRef = `refs/remotes/origin/${branch}`;
    const [localOid, remoteOid] = await Promise.all([
      git.resolveRef({ fs, dir, ref: localRef }),
      git.resolveRef({ fs, dir, ref: remoteRef }),
    ]);

    if (localOid === remoteOid) {
      return { ahead: 0, behind: 0, syncState: 'synced' as const };
    }

    const [localLog, remoteLog] = await Promise.all([
      git.log({ fs, dir, ref: localRef, depth: 250 }),
      git.log({ fs, dir, ref: remoteRef, depth: 250 }),
    ]);
    const remoteOids = new Set(remoteLog.map((entry) => entry.oid));
    const shared = localLog.find((entry) => remoteOids.has(entry.oid));

    if (!shared) {
      return {
        ahead: localLog.length,
        behind: remoteLog.length,
        syncState: 'diverged' as const,
      };
    }

    const ahead = localLog.findIndex((entry) => entry.oid === shared.oid);
    const behind = remoteLog.findIndex((entry) => entry.oid === shared.oid);
    const syncState: GitSyncState =
      ahead > 0 && behind > 0 ? 'diverged' : ahead > 0 ? 'ahead' : behind > 0 ? 'behind' : 'synced';

    return { ahead, behind, syncState };
  } catch {
    return { ahead: 0, behind: 0, syncState: 'unknown' as const };
  }
}

export function useGitWorkspace() {
  const [ready, setReady] = useState(false);
  const [webcontainer, setWebcontainer] = useState<WebContainer>();
  const [fs, setFs] = useState<PromiseFsClient>();
  const fileData = useRef<Record<string, { data: any; encoding?: string }>>({});

  useEffect(() => {
    webcontainerPromise.then((container) => {
      setWebcontainer(container);
      setFs(createGitWorkspaceFs(container, fileData));
      setReady(true);
    });
  }, []);

  const requireWorkspace = useCallback(() => {
    if (!ready || !webcontainer || !fs) {
      throw new Error('Git workspace is still loading. Please try again.');
    }

    return { dir: webcontainer.workdir, fs };
  }, [ready, webcontainer, fs]);

  const getStatus = useCallback(async (): Promise<GitWorkspaceStatus> => {
    const workspace = requireWorkspace();

    try {
      await git.resolveRef({ fs: workspace.fs, dir: workspace.dir, ref: 'HEAD' });
    } catch {
      return EMPTY_STATUS;
    }

    const [branch, remotes, matrix] = await Promise.all([
      git.currentBranch({ fs: workspace.fs, dir: workspace.dir, fullname: false }),
      git.listRemotes({ fs: workspace.fs, dir: workspace.dir }),
      git.statusMatrix({ fs: workspace.fs, dir: workspace.dir }),
    ]);
    const origin = remotes.find((remote) => remote.remote === 'origin') || remotes[0];
    const changes = matrix
      .map((row) => classifyGitStatusRow(row as GitStatusMatrixRow))
      .filter((change): change is GitFileChange => Boolean(change));
    const sync = branch
      ? await getAheadBehind(workspace.fs, workspace.dir, branch)
      : { ahead: 0, behind: 0, syncState: 'unknown' as const };

    return {
      isRepository: true,
      branch: branch || null,
      remoteUrl: origin?.url || null,
      changes,
      ...sync,
    };
  }, [requireWorkspace]);

  const fetchRemote = useCallback(async () => {
    const workspace = requireWorkspace();
    const status = await getStatus();

    if (!status.isRepository || !status.remoteUrl || !status.branch) {
      throw new Error('No Git repository with an origin remote is loaded.');
    }

    await git.fetch({
      fs: workspace.fs,
      dir: workspace.dir,
      remote: 'origin',
      ref: status.branch,
      singleBranch: true,
      ...networkOptions(status.remoteUrl),
    });

    return getStatus();
  }, [getStatus, requireWorkspace]);

  const pull = useCallback(
    async (author: GitCommitAuthor) => {
      const workspace = requireWorkspace();
      const status = await getStatus();

      if (!status.isRepository || !status.remoteUrl || !status.branch) {
        throw new Error('No Git repository with an origin remote is loaded.');
      }

      if (status.changes.length > 0) {
        throw new Error('Commit your local changes before pulling from GitHub.');
      }

      await git.pull({
        fs: workspace.fs,
        dir: workspace.dir,
        remote: 'origin',
        ref: status.branch,
        singleBranch: true,
        fastForwardOnly: true,
        author,
        ...networkOptions(status.remoteUrl),
      });

      return getStatus();
    },
    [getStatus, requireWorkspace],
  );

  const commitAll = useCallback(
    async (message: string, author: GitCommitAuthor) => {
      const workspace = requireWorkspace();
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        throw new Error('Enter a commit message first.');
      }

      const status = await getStatus();

      if (!status.isRepository) {
        throw new Error('No Git repository is loaded.');
      }

      if (status.changes.length === 0) {
        throw new Error('There are no changes to commit.');
      }

      const matrix = await git.statusMatrix({ fs: workspace.fs, dir: workspace.dir });

      for (const [filepath, head, workdir, stage] of matrix) {
        if (head === 1 && workdir === 1 && stage === 1) {
          continue;
        }

        if (head === 0 && workdir === 0 && stage === 0) {
          continue;
        }

        if (workdir === 0) {
          await git.remove({ fs: workspace.fs, dir: workspace.dir, filepath });
        } else {
          await git.add({ fs: workspace.fs, dir: workspace.dir, filepath });
        }
      }

      const oid = await git.commit({
        fs: workspace.fs,
        dir: workspace.dir,
        message: trimmedMessage,
        author,
      });

      return { oid, status: await getStatus() };
    },
    [getStatus, requireWorkspace],
  );

  const push = useCallback(async () => {
    const workspace = requireWorkspace();
    const status = await getStatus();

    if (!status.isRepository || !status.remoteUrl || !status.branch) {
      throw new Error('No Git repository with an origin remote is loaded.');
    }

    await git.push({
      fs: workspace.fs,
      dir: workspace.dir,
      remote: 'origin',
      ref: status.branch,
      force: false,
      ...networkOptions(status.remoteUrl),
    });

    return getStatus();
  }, [getStatus, requireWorkspace]);

  const createBranch = useCallback(
    async (name: string) => {
      const workspace = requireWorkspace();
      const branchName = name.trim();
      const status = await getStatus();

      if (!status.isRepository) {
        throw new Error('No Git repository is loaded.');
      }

      if (!branchName) {
        throw new Error('Enter a branch name first.');
      }

      if (status.changes.length > 0) {
        throw new Error('Commit your local changes before creating a branch.');
      }

      const branches = await git.listBranches({ fs: workspace.fs, dir: workspace.dir });

      if (branches.includes(branchName)) {
        throw new Error(`Branch "${branchName}" already exists locally.`);
      }

      await git.branch({
        fs: workspace.fs,
        dir: workspace.dir,
        ref: branchName,
        checkout: true,
        force: false,
      });

      return getStatus();
    },
    [getStatus, requireWorkspace],
  );

  const switchBranch = useCallback(
    async (name: string) => {
      const workspace = requireWorkspace();
      const branchName = name.trim();
      const status = await getStatus();

      if (!status.isRepository) {
        throw new Error('No Git repository is loaded.');
      }

      if (!branchName) {
        throw new Error('Enter a branch name first.');
      }

      if (status.changes.length > 0) {
        throw new Error('Commit your local changes before switching branches.');
      }

      if (status.branch === branchName) {
        return status;
      }

      const localBranches = await git.listBranches({ fs: workspace.fs, dir: workspace.dir });

      if (localBranches.includes(branchName)) {
        await git.checkout({ fs: workspace.fs, dir: workspace.dir, ref: branchName, force: false });
        return getStatus();
      }

      if (!status.remoteUrl) {
        throw new Error(`Branch "${branchName}" is not available locally and no origin remote is configured.`);
      }

      await git.fetch({
        fs: workspace.fs,
        dir: workspace.dir,
        remote: 'origin',
        ref: branchName,
        singleBranch: true,
        ...networkOptions(status.remoteUrl),
      });
      await git.checkout({
        fs: workspace.fs,
        dir: workspace.dir,
        ref: branchName,
        remote: 'origin',
        track: true,
        force: false,
      });

      return getStatus();
    },
    [getStatus, requireWorkspace],
  );

  return useMemo(
    () => ({ ready, getStatus, fetchRemote, pull, commitAll, push, createBranch, switchBranch }),
    [ready, getStatus, fetchRemote, pull, commitAll, push, createBranch, switchBranch],
  );
}

export const createGitWorkspaceFs = (
  webcontainer: WebContainer,
  record: MutableRefObject<Record<string, { data: any; encoding?: string }>>,
): PromiseFsClient => ({
  promises: {
    readFile: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);
      return webcontainer.fs.readFile(relativePath, options?.encoding);
    },
    writeFile: async (path: string, data: any, options: any = {}) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);
      record.current[relativePath] = { data, encoding: options?.encoding };

      if (data instanceof Uint8Array) {
        return webcontainer.fs.writeFile(relativePath, data);
      }

      return webcontainer.fs.writeFile(relativePath, data, options?.encoding || 'utf8');
    },
    mkdir: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);
      return webcontainer.fs.mkdir(relativePath, { ...options, recursive: true });
    },
    readdir: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);
      return webcontainer.fs.readdir(relativePath, options);
    },
    rmdir: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);
      return webcontainer.fs.rm(relativePath, { recursive: true, ...(options || {}) });
    },
    unlink: async (path: string) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);
      return webcontainer.fs.rm(relativePath, { recursive: false });
    },
    stat: async (path: string) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      if (relativePath === '.' || relativePath === '') {
        return statShape(false, true, 4096);
      }

      const dirPath = pathUtils.dirname(relativePath);
      const fileName = pathUtils.basename(relativePath);

      if (relativePath === '.git/index') {
        return statShape(true, false, 12);
      }

      const entries = await webcontainer.fs.readdir(dirPath, { withFileTypes: true });
      const fileInfo = entries.find((entry) => entry.name === fileName);

      if (!fileInfo) {
        const error = new Error(`ENOENT: no such file or directory, stat '${path}'`) as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        error.errno = -2;
        error.syscall = 'stat';
        error.path = path;
        throw error;
      }

      return statShape(fileInfo.isFile(), fileInfo.isDirectory(), fileInfo.isDirectory() ? 4096 : 1);
    },
    lstat: async (path: string) => createGitWorkspaceFs(webcontainer, record).promises.stat(path),
    readlink: async (path: string) => {
      throw new Error(`EINVAL: invalid argument, readlink '${path}'`);
    },
    symlink: async (target: string, path: string) => {
      throw new Error(`EPERM: operation not permitted, symlink '${target}' -> '${path}'`);
    },
    chmod: async () => Promise.resolve(),
  },
});

const statShape = (isFile: boolean, isDirectory: boolean, size: number) => ({
  isFile: () => isFile,
  isDirectory: () => isDirectory,
  isSymbolicLink: () => false,
  size,
  mode: isDirectory ? 0o040755 : 0o100644,
  mtimeMs: Date.now(),
  ctimeMs: Date.now(),
  birthtimeMs: Date.now(),
  atimeMs: Date.now(),
  uid: 1000,
  gid: 1000,
  dev: 1,
  ino: 1,
  nlink: 1,
  rdev: 0,
  blksize: 4096,
  blocks: isDirectory ? 8 : 1,
  mtime: new Date(),
  ctime: new Date(),
  birthtime: new Date(),
  atime: new Date(),
});

const pathUtils = {
  dirname: (path: string) => {
    if (!path || !path.includes('/')) {
      return '.';
    }

    path = path.replace(/\/+$/, '');
    return path.split('/').slice(0, -1).join('/') || '/';
  },
  basename: (path: string) => path.replace(/\/+$/, '').split('/').pop() || '',
  relative: (from: string, to: string) => {
    if (!from || !to) {
      return '.';
    }

    const normalize = (value: string) => value.replace(/\/+$/, '').split('/').filter(Boolean);
    const fromParts = normalize(from);
    const toParts = normalize(to);
    let commonLength = 0;

    while (
      commonLength < Math.min(fromParts.length, toParts.length) &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }

    const relativeParts = [...Array(fromParts.length - commonLength).fill('..'), ...toParts.slice(commonLength)];

    return relativeParts.length === 0 ? '.' : relativeParts.join('/');
  },
};
