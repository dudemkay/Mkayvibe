import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { useGitHubConnection } from '~/lib/hooks/useGitHubConnection';
import { useGitWorkspace, type GitWorkspaceStatus } from '~/lib/hooks/useGitWorkspace';
import type { GitFileStatus } from '~/lib/git/gitStatus';

const STATUS_LABELS: Record<GitFileStatus, string> = {
  added: 'Added',
  modified: 'Modified',
  deleted: 'Deleted',
  untracked: 'Untracked',
};

function getRepositoryName(remoteUrl: string | null) {
  if (!remoteUrl) {
    return 'Repository';
  }

  const normalized = remoteUrl.replace(/#.*$/, '').replace(/\.git$/, '').replace(/\/+$/, '');
  return normalized.split('/').pop()?.split(':').pop() || 'Repository';
}

export function MobileGitView() {
  const { ready, getStatus, fetchRemote, pull, commitAll, push } = useGitWorkspace();
  const { connection } = useGitHubConnection();
  const [status, setStatus] = useState<GitWorkspaceStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [activeAction, setActiveAction] = useState<'refresh' | 'fetch' | 'pull' | 'commit' | 'push' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ready) {
      return;
    }

    setActiveAction('refresh');
    setError(null);

    try {
      setStatus(await getStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read Git status.');
    } finally {
      setActiveAction(null);
    }
  }, [getStatus, ready]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const author = useMemo(() => {
    const user = connection?.user;
    const login = user?.login || 'mkayvibe-user';

    return {
      name: user?.name || login,
      email: `${login}@users.noreply.github.com`,
    };
  }, [connection]);

  const runAction = useCallback(
    async (
      action: 'fetch' | 'pull' | 'commit' | 'push',
      operation: () => Promise<GitWorkspaceStatus | { status: GitWorkspaceStatus }>,
      successMessage: string,
    ) => {
      setActiveAction(action);
      setError(null);

      try {
        const result = await operation();
        setStatus('status' in result ? result.status : result);
        toast.success(successMessage);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Git operation failed.';
        setError(message);
        toast.error(message);
      } finally {
        setActiveAction(null);
      }
    },
    [],
  );

  if (!ready || !status) {
    return (
      <section className="flex h-full w-full items-center justify-center p-6 text-center" data-testid="mobile-git-view">
        <div>
          <div className="i-svg-spinners:90-ring-with-bg mx-auto mb-3 text-3xl text-bolt-elements-textSecondary" />
          <p className="text-sm text-bolt-elements-textSecondary">Loading Git workspace...</p>
        </div>
      </section>
    );
  }

  if (!status.isRepository) {
    return (
      <section className="flex h-full w-full items-center justify-center p-6 text-center" data-testid="mobile-git-view">
        <div className="max-w-sm rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-6 shadow-sm">
          <div className="i-ph:git-branch mx-auto mb-3 text-4xl text-bolt-elements-textSecondary" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">No Git repository loaded</h2>
          <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">
            Import or clone a GitHub repository first. Its Git controls will then appear here automatically.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refresh()} disabled={activeAction !== null}>
            Refresh
          </Button>
        </div>
      </section>
    );
  }

  const repositoryName = getRepositoryName(status.remoteUrl);
  const syncText =
    status.syncState === 'synced'
      ? 'Up to date'
      : status.syncState === 'ahead'
        ? `${status.ahead} ahead`
        : status.syncState === 'behind'
          ? `${status.behind} behind`
          : status.syncState === 'diverged'
            ? `${status.ahead} ahead, ${status.behind} behind`
            : 'Fetch to check sync';
  const isBusy = activeAction !== null;

  return (
    <section
      className="h-full w-full overflow-y-auto px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4"
      data-testid="mobile-git-view"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="i-ph:github-logo shrink-0 text-xl text-bolt-elements-textPrimary" aria-hidden="true" />
                <h2 className="truncate text-lg font-semibold text-bolt-elements-textPrimary">{repositoryName}</h2>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-bolt-elements-textSecondary">
                <span className="inline-flex items-center gap-1 rounded-full border border-bolt-elements-borderColor px-2 py-1">
                  <span className="i-ph:git-branch" aria-hidden="true" />
                  {status.branch || 'Detached HEAD'}
                </span>
                <span className="rounded-full border border-bolt-elements-borderColor px-2 py-1">{syncText}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isBusy}
              aria-label="Refresh Git status"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-bolt-elements-textSecondary transition-colors hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary disabled:opacity-50"
            >
              <span className={activeAction === 'refresh' ? 'i-svg-spinners:90-ring-with-bg' : 'i-ph:arrows-clockwise'} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => void runAction('fetch', fetchRemote, 'Fetched latest GitHub state')}
              disabled={isBusy || !status.remoteUrl}
            >
              {activeAction === 'fetch' ? 'Fetching...' : 'Fetch'}
            </Button>
            <Button
              variant="outline"
              onClick={() => void runAction('pull', () => pull(author), 'Pulled latest changes')}
              disabled={isBusy || !status.remoteUrl || status.changes.length > 0}
            >
              {activeAction === 'pull' ? 'Pulling...' : 'Pull'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500" role="alert">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-sm">
          <div className="flex items-center justify-between border-b border-bolt-elements-borderColor px-4 py-3">
            <h3 className="font-medium text-bolt-elements-textPrimary">Changes</h3>
            <span className="text-xs text-bolt-elements-textSecondary">{status.changes.length}</span>
          </div>

          {status.changes.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="i-ph:check-circle mx-auto mb-2 text-2xl text-bolt-elements-textSecondary" />
              <p className="text-sm text-bolt-elements-textSecondary">Working tree is clean.</p>
            </div>
          ) : (
            <div className="divide-y divide-bolt-elements-borderColor">
              {status.changes.map((change) => (
                <div key={change.path} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-bolt-elements-textPrimary">{change.path}</p>
                    {change.staged && <p className="mt-0.5 text-xs text-bolt-elements-textSecondary">Staged</p>}
                  </div>
                  <span className="shrink-0 rounded-md border border-bolt-elements-borderColor px-2 py-1 text-xs text-bolt-elements-textSecondary">
                    {STATUS_LABELS[change.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 shadow-sm">
          <label htmlFor="mobile-git-commit-message" className="text-sm font-medium text-bolt-elements-textPrimary">
            Commit changes
          </label>
          <textarea
            id="mobile-git-commit-message"
            value={commitMessage}
            onChange={(event) => setCommitMessage(event.target.value)}
            placeholder="Commit message"
            rows={3}
            className="mt-2 w-full resize-none rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-2 text-sm text-bolt-elements-textPrimary outline-none placeholder:text-bolt-elements-textTertiary focus:border-bolt-elements-borderColorActive"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={() =>
                void runAction(
                  'commit',
                  async () => {
                    const result = await commitAll(commitMessage, author);
                    setCommitMessage('');
                    return result;
                  },
                  'Changes committed',
                )
              }
              disabled={isBusy || status.changes.length === 0 || !commitMessage.trim()}
            >
              {activeAction === 'commit' ? 'Committing...' : 'Commit'}
            </Button>
            <Button
              variant="outline"
              onClick={() => void runAction('push', push, 'Pushed to GitHub')}
              disabled={isBusy || !status.remoteUrl || !status.branch}
            >
              {activeAction === 'push' ? 'Pushing...' : 'Push'}
            </Button>
          </div>
          {status.changes.length > 0 && (
            <p className="mt-2 text-xs text-bolt-elements-textSecondary">
              Commit stages all current changes. Pull is disabled until the working tree is clean.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
