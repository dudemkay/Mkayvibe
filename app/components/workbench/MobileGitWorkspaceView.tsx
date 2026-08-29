import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { useGitHubConnection } from '~/lib/hooks/useGitHubConnection';
import { useGitWorkspace, type GitWorkspaceStatus } from '~/lib/hooks/useGitWorkspace';
import { MobileGitView } from './MobileGitView';

function getRepositoryName(remoteUrl: string | null) {
  if (!remoteUrl) {
    return 'Repository';
  }

  const normalized = remoteUrl.replace(/#.*$/, '').replace(/\.git$/, '').replace(/\/+$/, '');
  return normalized.split('/').pop()?.split(':').pop() || 'Repository';
}

export function MobileGitWorkspaceView() {
  const { ready, getStatus, pull, commitAll, push } = useGitWorkspace();
  const { connection } = useGitHubConnection();
  const [status, setStatus] = useState<GitWorkspaceStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [commitMessage, setCommitMessage] = useState('Update from Mkayvibe');

  const author = useMemo(() => {
    const user = connection?.user;
    const login = user?.login || 'mkayvibe-user';

    return {
      name: user?.name || login,
      email: `${login}@users.noreply.github.com`,
    };
  }, [connection]);

  const refresh = useCallback(async () => {
    if (!ready) {
      return;
    }

    try {
      setError(null);
      setStatus(await getStatus());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not read Git status.');
    }
  }, [getStatus, ready]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sync = useCallback(async () => {
    if (!status || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      let nextStatus = status;

      if (nextStatus.changes.length > 0) {
        const result = await commitAll(commitMessage.trim() || 'Update from Mkayvibe', author);
        nextStatus = result.status;
        setStatus(nextStatus);
      }

      if (nextStatus.syncState === 'behind' && nextStatus.changes.length === 0) {
        nextStatus = await pull(author);
        setStatus(nextStatus);
        toast.success('Pulled latest GitHub changes');
        return;
      }

      if (nextStatus.syncState === 'diverged') {
        throw new Error('This branch has diverged from GitHub. Open Advanced Git to review it safely.');
      }

      if (nextStatus.syncState !== 'synced' || status.changes.length > 0) {
        nextStatus = await push();
        setStatus(nextStatus);
        toast.success('Synced to GitHub');
        return;
      }

      toast.info('Workspace is already up to date');
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : 'Could not sync to GitHub.';
      setError(message);
      toast.error(message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [author, busy, commitAll, commitMessage, pull, push, refresh, status]);

  if (advanced) {
    return (
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-bolt-elements-background-depth-1">
        <div className="flex min-h-12 items-center gap-2 border-b border-bolt-elements-borderColor px-3">
          <button
            type="button"
            onClick={() => {
              setAdvanced(false);
              void refresh();
            }}
            className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-bolt-elements-textPrimary active:bg-bolt-elements-background-depth-2"
          >
            <span className="i-ph:arrow-left" aria-hidden="true" />
            Back to Sync
          </button>
        </div>
        <div className="min-h-0 overflow-hidden">
          <MobileGitView />
        </div>
      </section>
    );
  }

  if (!ready || !status) {
    return (
      <section className="flex h-full w-full items-center justify-center p-6 text-center">
        <div>
          <div className="i-svg-spinners:90-ring-with-bg mx-auto mb-3 text-3xl text-bolt-elements-textSecondary" />
          <p className="text-sm text-bolt-elements-textSecondary">Checking GitHub sync…</p>
        </div>
      </section>
    );
  }

  if (!status.isRepository) {
    return <MobileGitView />;
  }

  const repositoryName = getRepositoryName(status.remoteUrl);
  const changeCount = status.changes.length;
  const changesLabel = `${changeCount} ${changeCount === 1 ? 'change' : 'changes'}`;
  const syncLabel =
    status.syncState === 'synced'
      ? 'Up to date'
      : status.syncState === 'ahead'
        ? `${status.ahead} ahead`
        : status.syncState === 'behind'
          ? `${status.behind} behind`
          : status.syncState === 'diverged'
            ? 'Needs review'
            : 'Ready to check';
  const primaryLabel =
    status.syncState === 'synced' && changeCount === 0
      ? 'Up to date'
      : status.syncState === 'behind' && changeCount === 0
        ? 'Pull latest'
        : status.syncState === 'diverged'
          ? 'Review in Advanced Git'
          : 'Sync to GitHub';
  const primaryDisabled = busy || status.syncState === 'diverged' || (status.syncState === 'synced' && changeCount === 0);

  return (
    <section className="h-full w-full overflow-y-auto px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <div className="rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bolt-elements-background-depth-2 text-2xl text-bolt-elements-textPrimary">
              <span className="i-ph:github-logo" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-bolt-elements-textTertiary">Connected workspace</p>
              <h2 className="mt-1 truncate text-lg font-semibold text-bolt-elements-textPrimary">{repositoryName}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-bolt-elements-textSecondary">
                <span className="inline-flex items-center gap-1 rounded-full border border-bolt-elements-borderColor px-2 py-1">
                  <span className="i-ph:git-branch" aria-hidden="true" />
                  {status.branch || 'Detached HEAD'}
                </span>
                <span className="rounded-full border border-bolt-elements-borderColor px-2 py-1">{changesLabel}</span>
                <span className="rounded-full border border-bolt-elements-borderColor px-2 py-1">{syncLabel}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-bolt-elements-textSecondary">
            Your Chat, Files and Code edits are in this Git working tree. Sync saves the current changes and sends them back to GitHub safely.
          </p>

          {changeCount > 0 && (
            <div className="mt-4">
              <label htmlFor="mobile-sync-commit-message" className="text-xs font-medium text-bolt-elements-textSecondary">
                Save message
              </label>
              <input
                id="mobile-sync-commit-message"
                type="text"
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 text-base text-bolt-elements-textPrimary outline-none placeholder:text-bolt-elements-textTertiary focus:border-bolt-elements-borderColorActive"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500" role="alert">
              {error}
            </div>
          )}

          <Button className="mt-4 min-h-12 w-full" onClick={() => void sync()} disabled={primaryDisabled}>
            {busy ? 'Syncing…' : primaryLabel}
          </Button>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={busy}>
              Refresh status
            </Button>
            <Button variant="outline" onClick={() => setAdvanced(true)} disabled={busy}>
              Advanced Git
            </Button>
          </div>
        </div>

        {changeCount > 0 && (
          <div className="rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-sm">
            <div className="flex items-center justify-between border-b border-bolt-elements-borderColor px-4 py-3">
              <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Unsynced changes</h3>
              <span className="text-xs text-bolt-elements-textSecondary">{changeCount}</span>
            </div>
            <div className="divide-y divide-bolt-elements-borderColor">
              {status.changes.slice(0, 12).map((change) => (
                <div key={change.path} className="flex items-center gap-3 px-4 py-3">
                  <span className="i-ph:file-code shrink-0 text-bolt-elements-textTertiary" aria-hidden="true" />
                  <p className="min-w-0 flex-1 truncate text-sm text-bolt-elements-textPrimary">{change.path}</p>
                  <span className="text-xs capitalize text-bolt-elements-textSecondary">{change.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
