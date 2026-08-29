import type { WebContainer } from '@webcontainer/api';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { webcontainer as webcontainerPromise } from '~/lib/webcontainer';
import { BROWSER_GIT_CLONE_OPTIONS, type GitCloneProgressEvent } from '~/lib/git/gitCloneBrowserOptions';
import git, { type GitAuth, type PromiseFsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const WEB_CONTAINER_BOOT_TIMEOUT_MS = 20_000;

const lookupSavedPassword = (url: string) => {
  const domain = url.split('/')[2];
  const gitCreds = Cookies.get(`git:${domain}`);

  if (!gitCreds) {
    return null;
  }

  try {
    const { username, password } = JSON.parse(gitCreds || '{}');
    return { username, password };
  } catch (error) {
    console.log(`Failed to parse Git Cookie ${error}`);
    return null;
  }
};

const saveGitAuth = (url: string, auth: GitAuth) => {
  const domain = url.split('/')[2];
  Cookies.set(`git:${domain}`, JSON.stringify(auth));
};

export function useGit() {
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [webcontainer, setWebcontainer] = useState<WebContainer>();
  const [fs, setFs] = useState<PromiseFsClient>();
  const fileData = useRef<Record<string, { data: any; encoding?: string }>>({});

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active && !ready) {
        setInitializationError(
          'The browser coding runtime did not start. Reload and try again, or use a supported modern browser.',
        );
      }
    }, WEB_CONTAINER_BOOT_TIMEOUT_MS);

    webcontainerPromise
      .then((container) => {
        if (!active) {
          return;
        }

        fileData.current = {};
        setWebcontainer(container);
        setFs(getFs(container, fileData));
        setInitializationError(null);
        setReady(true);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        console.error('WebContainer initialization failed:', error);
        setInitializationError(
          error instanceof Error
            ? `The browser coding runtime could not start: ${error.message}`
            : 'The browser coding runtime could not start.',
        );
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const gitClone = useCallback(
    async (
      url: string,
      retryCount = 0,
      onProgress?: (event: GitCloneProgressEvent) => void,
    ): Promise<{ workdir: string; data: Record<string, { data: any; encoding?: string }> }> => {
      if (!webcontainer || !fs || !ready) {
        throw new Error(initializationError || 'Browser coding runtime is not initialized yet.');
      }

      fileData.current = {};

      let branch: string | undefined;
      let baseUrl = url;

      if (url.includes('#')) {
        [baseUrl, branch] = url.split('#');
      }

      const headers: Record<string, string> = {
        'User-Agent': 'bolt.diy',
      };

      const savedAuth = lookupSavedPassword(url);

      if (savedAuth) {
        headers.Authorization = `Basic ${Buffer.from(`${savedAuth.username}:${savedAuth.password}`).toString('base64')}`;
      }

      try {
        if (retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
          console.log(`Retrying git clone (attempt ${retryCount + 1})...`);
        }

        await git.clone({
          fs,
          http,
          dir: webcontainer.workdir,
          url: baseUrl,
          depth: 1,
          singleBranch: true,
          ref: branch,
          corsProxy: '/api/git-proxy',
          headers,
          ...BROWSER_GIT_CLONE_OPTIONS,
          onProgress: (event) => {
            const progressEvent: GitCloneProgressEvent = {
              phase: event.phase,
              loaded: event.loaded,
              total: event.total,
            };
            console.log('Git clone progress:', progressEvent);
            onProgress?.(progressEvent);
          },
          onAuth: (authUrl) => {
            let auth = lookupSavedPassword(authUrl);

            if (auth) {
              return auth;
            }

            if (confirm('This repository requires authentication. Would you like to enter your GitHub credentials?')) {
              auth = {
                username: prompt('Enter username') || '',
                password: prompt('Enter password or personal access token') || '',
              };
              return auth;
            }

            return { cancel: true };
          },
          onAuthFailure: (authUrl) => {
            throw new Error(
              `Authentication failed for ${authUrl.split('/')[2]}. Reconnect GitHub in Settings and try again.`,
            );
          },
          onAuthSuccess: (authUrl, auth) => {
            saveGitAuth(authUrl, auth);
          },
        });

        const data: Record<string, { data: any; encoding?: string }> = {};

        for (const [key, value] of Object.entries(fileData.current)) {
          data[key] = value;
        }

        return { workdir: webcontainer.workdir, data };
      } catch (error) {
        console.error('Git clone error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('Authentication failed')) {
          toast.error('Authentication failed. Reconnect GitHub and try again.');
          throw error;
        }

        if (
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('Failed to fetch')
        ) {
          if (retryCount < 3) {
            return gitClone(url, retryCount + 1, onProgress);
          }

          throw new Error('Failed to connect to the repository after multiple attempts. Check your connection and retry.');
        }

        if (errorMessage.includes('404')) {
          throw new Error('Repository not found. Check that your GitHub connection can access it.');
        }

        if (errorMessage.includes('401') || errorMessage.includes('403')) {
          throw new Error('GitHub denied access to this repository. Reconnect GitHub with repository access and retry.');
        }

        throw error;
      }
    },
    [webcontainer, fs, ready, initializationError],
  );

  return { ready, error: initializationError, gitClone };
}

const getFs = (
  webcontainer: WebContainer,
  record: MutableRefObject<Record<string, { data: any; encoding?: string }>>,
): PromiseFsClient => ({
  promises: {
    readFile: async (path: string, options: any) => {
      const encoding = options?.encoding;
      const relativePath = pathUtils.relative(webcontainer.workdir, path);
      return webcontainer.fs.readFile(relativePath, encoding);
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
    lstat: async (path: string) => getFs(webcontainer, record).promises.stat(path),
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
  basename: (path: string, ext?: string) => {
    path = path.replace(/\/+$/, '');
    const base = path.split('/').pop() || '';
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  },
  relative: (from: string, to: string): string => {
    if (!from || !to) {
      return '.';
    }

    const normalizePathParts = (value: string) => value.replace(/\/+$/, '').split('/').filter(Boolean);
    const fromParts = normalizePathParts(from);
    const toParts = normalizePathParts(to);
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);

    for (let index = 0; index < minLength; index++) {
      if (fromParts[index] !== toParts[index]) {
        break;
      }

      commonLength++;
    }

    const upCount = fromParts.length - commonLength;
    const remainingPath = toParts.slice(commonLength);
    const relativeParts = [...Array(upCount).fill('..'), ...remainingPath];
    return relativeParts.length === 0 ? '.' : relativeParts.join('/');
  },
};
