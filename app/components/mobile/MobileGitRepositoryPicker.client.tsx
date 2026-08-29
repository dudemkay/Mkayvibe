import { useNavigate } from '@remix-run/react';
import { GitHubRepositorySelector } from '~/components/@settings/tabs/github/components/GitHubRepositorySelector';
import { useGitHubConnection } from '~/lib/hooks/useGitHubConnection';
import { buildGitImportUrl } from '~/lib/git/gitImport';

export function MobileGitRepositoryPicker() {
  const navigate = useNavigate();
  const { connection, isConnected } = useGitHubConnection();

  if (!isConnected || !connection) {
    return (
      <section className="flex h-full w-full items-center justify-center p-6 text-center" data-testid="mobile-git-repository-picker">
        <div className="max-w-sm rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-6 shadow-sm">
          <div className="i-ph:github-logo mx-auto mb-3 text-4xl text-bolt-elements-textSecondary" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Connect GitHub first</h2>
          <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">
            Open Settings → GitHub and connect your account. Then return here to choose a repository and branch.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="h-full w-full overflow-y-auto px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4"
      data-testid="mobile-git-repository-picker"
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="i-ph:github-logo text-xl text-bolt-elements-textPrimary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Choose a GitHub repository</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-bolt-elements-textSecondary">
            Select a repository and branch. Mkayvibe will then start the workspace runtime and import it.
          </p>
        </div>

        <GitHubRepositorySelector
          onClone={(repoUrl, branch) => navigate(buildGitImportUrl(repoUrl, branch))}
          className="pb-4"
        />
      </div>
    </section>
  );
}
