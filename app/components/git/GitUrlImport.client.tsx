import { useSearchParams } from '@remix-run/react';
import { useCallback, useEffect, useState } from 'react';
import { useChatHistory } from '~/lib/persistence';
import { createGitWorkspaceImportMessage, parseGitWorkspaceTarget } from '~/lib/git/gitWorkspaceImport';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';

export function GitUrlImport() {
  const [searchParams] = useSearchParams();
  const { ready: historyReady, importChat } = useChatHistory();
  const [imported, setImported] = useState(false);
  const [stage, setStage] = useState('Preparing Git workspace…');
  const [error, setError] = useState<string | null>(null);

  const importRepo = useCallback(
    async (target: string) => {
      if (!historyReady) {
        throw new Error('Workspace storage is not ready yet.');
      }

      const { gitUrl, gitBranch } = parseGitWorkspaceTarget(target);

      if (!gitUrl) {
        throw new Error('No Git repository was selected.');
      }

      const repositoryName = gitUrl.replace(/\.git$/, '').replace(/\/+$/, '').split('/').pop() || 'Git Project';

      setStage('Creating Git workspace…');
      await importChat(
        `Git Project:${repositoryName}`,
        [createGitWorkspaceImportMessage(gitUrl, gitBranch)],
        { gitUrl, gitBranch },
      );

      setStage('Opening workspace…');
    },
    [historyReady, importChat],
  );

  useEffect(() => {
    if (error || imported) {
      return;
    }

    if (!historyReady) {
      setStage('Preparing local workspace storage…');
      return;
    }

    const target = searchParams.get('url');

    if (!target) {
      setError('No Git repository was selected.');
      return;
    }

    setImported(true);
    void importRepo(target).catch((importError) => {
      console.error('Error creating Git workspace:', importError);
      setError(importError instanceof Error ? importError.message : 'Failed to create Git workspace.');
    });
  }, [error, historyReady, importRepo, imported, searchParams]);

  if (error) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-bolt-elements-background-depth-1 p-5">
        <section className="w-full max-w-md rounded-3xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-5 shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
            <span className="i-ph:warning-circle" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-bolt-elements-textPrimary">Could not create Git workspace</h1>
          <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">{error}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-xl bg-accent-500 px-4 text-sm font-medium text-white"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="min-h-11 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-4 text-sm font-medium text-bolt-elements-textPrimary"
            >
              Back
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <LoadingOverlay message={stage} />;
}
