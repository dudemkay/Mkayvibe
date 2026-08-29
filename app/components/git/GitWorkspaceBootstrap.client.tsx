import { useEffect, useState, type ReactNode } from 'react';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { useGit } from '~/lib/hooks/useGit';
import { useGitWorkspace } from '~/lib/hooks/useGitWorkspace';
import { restoreGitWorkspaceSnapshot } from '~/lib/git/gitWorkspaceSnapshot';
import { db, getSnapshot, setSnapshot, type IChatMetadata } from '~/lib/persistence';
import { workbenchStore } from '~/lib/stores/workbench';
import { webcontainer } from '~/lib/webcontainer';

interface GitWorkspaceBootstrapProps {
  metadata?: IChatMetadata;
  chatId?: string;
  children: ReactNode;
}

type BootstrapState = 'waiting' | 'checking' | 'cloning' | 'restoring' | 'ready' | 'error';

function normalizeRemote(remoteUrl: string | null | undefined) {
  return (remoteUrl || '').trim().replace(/#.*$/, '').replace(/\.git$/, '').replace(/\/+$/, '').toLowerCase();
}

async function clearWorkspace() {
  const container = await webcontainer;
  const entries = await container.fs.readdir('.', { withFileTypes: true });

  for (const entry of entries) {
    await container.fs.rm(entry.name, { recursive: true });
  }
}

export function GitWorkspaceBootstrap({ metadata, chatId, children }: GitWorkspaceBootstrapProps) {
  const { ready: gitReady, error: gitError, gitClone } = useGit();
  const { ready: workspaceReady, getStatus } = useGitWorkspace();
  const [state, setState] = useState<BootstrapState>(metadata?.gitUrl ? 'waiting' : 'ready');
  const [stage, setStage] = useState('Preparing Git workspace…');
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!metadata?.gitUrl) {
      setState('ready');
      setError(null);
      return;
    }

    if (gitError) {
      setState('error');
      setError(gitError);
      return;
    }

    if (!gitReady || !workspaceReady) {
      setState('waiting');
      setStage('Starting browser coding runtime…');
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        setError(null);
        setState('checking');
        setStage('Checking Git workspace…');

        const currentStatus = await getStatus();
        const expectedRemote = normalizeRemote(metadata.gitUrl);
        const sameRepository = currentStatus.isRepository && normalizeRemote(currentStatus.remoteUrl) === expectedRemote;
        const sameBranch = !metadata.gitBranch || currentStatus.branch === metadata.gitBranch;

        if (!sameRepository || !sameBranch) {
          setState('cloning');
          setStage('Loading repository from GitHub…');
          await clearWorkspace();
          const cloneTarget = metadata.gitBranch ? `${metadata.gitUrl}#${metadata.gitBranch}` : metadata.gitUrl;
          await gitClone(cloneTarget);
        }

        if (db && chatId) {
          setState('restoring');
          setStage('Restoring your workspace…');
          const snapshot = await getSnapshot(db, chatId);
          const container = await webcontainer;
          await restoreGitWorkspaceSnapshot(container, snapshot);
        }

        const finalStatus = await getStatus();

        if (!finalStatus.isRepository || normalizeRemote(finalStatus.remoteUrl) !== expectedRemote) {
          throw new Error('Mkayvibe loaded the project files but could not restore the Git working tree. Retry the workspace.');
        }

        if (!cancelled) {
          setState('ready');
          setStage('Workspace ready');
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          const message = bootstrapError instanceof Error ? bootstrapError.message : 'Failed to load Git workspace.';
          console.error('Git workspace bootstrap failed:', bootstrapError);
          setError(message);
          setState('error');
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [chatId, getStatus, gitClone, gitError, gitReady, metadata?.gitBranch, metadata?.gitUrl, retryKey, workspaceReady]);

  useEffect(() => {
    if (!metadata?.gitUrl || state !== 'ready' || !db || !chatId) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = workbenchStore.files.subscribe((files) => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        void setSnapshot(db, chatId, { chatIndex: '', files }).catch((snapshotError) => {
          console.error('Failed to autosave Git workspace snapshot:', snapshotError);
        });
      }, 800);
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      unsubscribe();
    };
  }, [chatId, metadata?.gitUrl, state]);

  if (!metadata?.gitUrl || state === 'ready') {
    return <>{children}</>;
  }

  if (state === 'error') {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-bolt-elements-background-depth-1 p-5">
        <section className="w-full max-w-md rounded-3xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-5 shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
            <span className="i-ph:warning-circle" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-bolt-elements-textPrimary">Could not load Git workspace</h1>
          <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="mt-5 min-h-11 w-full rounded-xl bg-accent-500 px-4 text-sm font-medium text-white"
          >
            Retry workspace
          </button>
        </section>
      </main>
    );
  }

  return <LoadingOverlay message={stage} />;
}
