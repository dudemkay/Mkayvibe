import type { WebContainer } from '@webcontainer/api';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { webcontainer as webcontainerPromise } from '~/lib/webcontainer';
import { BROWSER_GIT_CLONE_OPTIONS, type GitCloneProgressEvent } from '~/lib/git/gitCloneBrowserOptions';
import git, { type GitAuth, type PromiseFsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const WEB_CONTAINER_BOOT_TIMEOUT_MS = 20_000;
const GIT_CLONE_STALL_TIMEOUT_MS = 90_000;

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
      if (active) {
        setInitializationError(
          'The browser coding runtime did not start. Reload and try again in a supported modern browser.',
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

      const auth = lookupSavedPassword(url);

      if (auth) {
        headers.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`;
      }

      try {
        if (retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
          console.log(`Retrying git clone (attempt ${retryCount + 1})...`);
        }

        await new Promise<void>((resolve, reject) => {
          let stallTimer = window.setTimeout(() => {
            reject(new Error('Repository cloning stopped making progress. Check your connection and retry.'));
          }, GIT_CLONE_STALL_TIMEOUT_MS);

          const resetStallTimer = () => {
            window.clearTimeout(stallTimer);
            stallTimer = window.setTimeout(() => {
              reject(new Error('Repository cloning stopped making progress. Check your connection and retry.'));
            }, GIT_CLONE_STALL_TIMEOUT_MS);
          };

          git
            .clone({
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
                resetStallTimer();
                const progressEvent: GitCloneProgressEvent = {
                  phase: event.phase,
                  loaded: event.loaded,
                  total: event.total,
                };
                console.log('Git clone progress:', progressEvent);
                onProgress?.(progressEvent);
              },
              onAuth: (authUrl) => {
                let nextAuth = lookupSavedPassword(authUrl);

                if (nextAuth) {
                  console.log('Using saved authentication for', authUrl);
                  return nextAuth;
                }

                console.log('Repository requires authentication:', authUrl);

                if (confirm('This repository requires authentication. Would you like to enter your GitHub credentials?')) {
                  nextAuth = {
                    username: prompt('Enter username') || '',
                    password: prompt('Enter password or personal access token') || '',
                  };
                  return nextAuth;
                }

                return { cancel: true };
              },
              onAuthFailure: (authUrl, _auth) => {
                throw new Error(
                  `Authentication failed for ${authUrl.split('/')[2]}. Reconnect GitHub in Settings and try again.`,
                );
              },
              onAuthSuccess: (authUrl, successfulAuth) => {
                saveGitAuth(authUrl, successfulAuth);
              },
            })
            .then(resolve, reject)
            .finally(() => window.clearTimeout(stallTimer));
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
        } else if (
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('Failed to fetch')
        ) {
          toast.error('Network error while connecting to repository. Please check your internet connection.');

          if (retryCount < 3) {
            return gitClone(url, retryCount + 1, onProgress);
          }

          throw new Error('Failed to connect to repository after multiple attempts. Check your connection and retry.');
        } else if (errorMessage.includes('404')) {
          throw new Error('Repository not found. Check that your GitHub connection can access it.');
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          throw new Error('GitHub denied access to this repository. Reconnect GitHub with repository access and retry.');
        } else {
          toast.error(`Failed to clone repository: ${errorMessage}`);
          throw error;
        }
      }
    },
    [webcontainer, fs, ready, initializationError],
  );

  return { ready, error: initializationError, gitClone };
}

const getFs = (
  webcontainer: WebContainer,
  record: MutableRefObject<Record<string, { data: any; encoding?: string }>>,
) => ({
  promises: {
    readFile: async (path: string, options: any) => {
      const encoding = options?.encoding;
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      try {
        const result = await webcontainer.fs.readFile(relativePath, encoding);

        return result;
      } catch (error) {
        throw error;
      }
    },
    writeFile: async (path: string, data: any, options: any = {}) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      if (record.current) {
        record.current[relativePath] = { data, encoding: options?.encoding };
      }

      try {
        if (data instanceof Uint8Array) {
          const result = await webcontainer.fs.writeFile(relativePath, data);
          return result;
        } else {
          const encoding = options?.encoding || 'utf8';
          const result = await webcontainer.fs.writeFile(relativePath, data, encoding);

          return result;
        }
      } catch (error) {
        throw error;
      }
    },
    mkdir: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      try {
        const result = await webcontainer.fs.mkdir(relativePath, { ...options, recursive: true });

        return result;
      } catch (error) {
        throw error;
      }
    },
    readdir: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      try {
        const result = await webcontainer.fs.readdir(relativePath, options);

        return result;
      } catch (error) {
        throw error;
      }
    },
    rm: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      try {
        const result = await webcontainer.fs.rm(relativePath, { ...(options || {}) });

        return result;
      } catch (error) {
        throw error;
      }
    },
    rmdir: async (path: string, options: any) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      try {
        const result = await webcontainer.fs.rm(relativePath, { recursive: true, ...options });

        return result;
      } catch (error) {
        throw error;
      }
    },
    unlink: async (path: string) => {
      const relativePath = pathUtils.relative(webcontainer.workdir, path);

      try {
        return await webcontainer.fs.rm(relativePath, { recursive: false });
      } catch (error) {
        throw error;
      }
    },
    stat: async (path: string) => {
      try {
        const relativePath = pathUtils.relative(webcontainer.workdir, path);
        const dirPath = pathUtils.dirname(relativePath);
        const fileName = pathUtils.basename(relativePath);

        if (relativePath === '.git/index') {
          return {
            isFile: () => true,
            isDirectory: () => false,
            isSymbolicLink: () => false,
            size: 12,
            mode: 0o100644,
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
            blocks: 1,
            mtime: new Date(),
            ctime: new Date(),
            birthtime: new Date(),
            atime: new Date(),
          };
        }

        const resp = await webcontainer.fs.readdir(dirPath, { withFileTypes: true });
        const fileInfo = resp.find((x) => x.name === fileName);

        if (!fileInfo) {
          const err = new Error(`ENOENT: no such file or directory, stat '${path}'`) as NodeJS.ErrnoException;
          err.code = 'ENOENT';
          err.errno = -2;
          err.syscall = 'stat';
          err.path = path;
          throw err;
        }

        return {
          isFile: () => fileInfo.isFile(),
          isDirectory: () => fileInfo.isDirectory(),
          isSymbolicLink: () => false,
          size: fileInfo.isDirectory() ? 4096 : 1,
          mode: fileInfo.isDirectory() ? 0o040755 : 0o100644,
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
          blocks: 8,
          mtime: new Date(),
          ctime: new Date(),
          birthtime: new Date(),
          atime: new Date(),
        };
      } catch (error: any) {
        if (!error.code) {
          error.code = 'ENOENT';
          error.errno = -2;
          error.syscall = 'stat';
          error.path = path;
        }

        throw error;
      }
    },
    lstat: async (path: string) => {
      return await getFs(webcontainer, record).promises.stat(path);
    },
    readlink: async (path: string) => {
      throw new Error(`EINVAL: invalid argument, readlink '${path}'`);
    },
    symlink: async (target: string, path: string) => {
      throw new Error(`EPERM: operation not permitted, symlink '${target}' -> '${path}'`);
    },
    chmod: async (_path: string, _mode: number) => {
      return await Promise.resolve();
    },
  },
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

    if (ext && base.endsWith(ext)) {
      return base.slice(0, -ext.length);
    }

    return base;
  },
  relative: (from: string, to: string): string => {
    if (!from || !to) {
      return '.';
    }

    const normalizePathParts = (p: string) => p.replace(/\/+$/, '').split('/').filter(Boolean);
    const fromParts = normalizePathParts(from);
    const toParts = normalizePathParts(to);
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);

    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] !== toParts[i]) {
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
