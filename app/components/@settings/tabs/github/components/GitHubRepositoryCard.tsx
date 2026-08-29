import React from 'react';
import type { GitHubRepoInfo } from '~/types/GitHub';

interface GitHubRepositoryCardProps {
  repo: GitHubRepoInfo;
  onClone?: (repo: GitHubRepoInfo) => void;
}

export function GitHubRepositoryCard({ repo, onClone }: GitHubRepositoryCardProps) {
  return (
    <article className="group flex h-full min-w-0 flex-col rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 transition-colors hover:border-bolt-elements-borderColorActive">
      <div className="flex-1 space-y-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="i-ph:git-repository h-4 w-4 shrink-0 text-bolt-elements-icon-info" />
            <h5 className="truncate text-sm font-medium text-bolt-elements-textPrimary">{repo.name}</h5>
            {repo.private && <div className="i-ph:lock h-3 w-3 shrink-0 text-bolt-elements-textTertiary" title="Private repository" />}
            {repo.fork && <div className="i-ph:git-fork h-3 w-3 shrink-0 text-bolt-elements-textTertiary" title="Forked repository" />}
            {repo.archived && <div className="i-ph:archive h-3 w-3 shrink-0 text-bolt-elements-textTertiary" title="Archived repository" />}
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-bolt-elements-textSecondary">
            <span className="flex items-center gap-1" title="Stars">
              <div className="i-ph:star h-3.5 w-3.5 text-bolt-elements-icon-warning" />
              {repo.stargazers_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1" title="Forks">
              <div className="i-ph:git-fork h-3.5 w-3.5 text-bolt-elements-icon-info" />
              {repo.forks_count.toLocaleString()}
            </span>
          </div>
        </div>

        {repo.description && <p className="line-clamp-2 text-xs leading-5 text-bolt-elements-textSecondary">{repo.description}</p>}

        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs text-bolt-elements-textSecondary">
          <span className="flex items-center gap-1" title="Default Branch">
            <div className="i-ph:git-branch h-3.5 w-3.5" />
            <span className="break-all">{repo.default_branch}</span>
          </span>
          {repo.language && (
            <span className="flex items-center gap-1" title="Primary Language">
              <div className="h-2 w-2 rounded-full bg-current opacity-60" />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1" title="Last Updated">
            <div className="i-ph:clock h-3.5 w-3.5" />
            {new Date(repo.updated_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {repo.topics && repo.topics.length > 0 && (
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
            {repo.topics.slice(0, 3).map((topic) => (
              <span key={topic} className="max-w-full truncate rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                {topic}
              </span>
            ))}
            {repo.topics.length > 3 && <span className="text-bolt-elements-textTertiary">+{repo.topics.length - 3} more</span>}
          </div>
        )}

        {repo.size ? <div className="text-xs text-bolt-elements-textTertiary">Size: {(repo.size / 1024).toFixed(1)} MB</div> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-bolt-elements-borderColor pt-3 sm:grid-cols-2">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-bolt-elements-borderColor px-3 py-2 text-sm text-bolt-elements-textSecondary transition-colors hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary"
        >
          <div className="i-ph:arrow-square-out h-4 w-4" />
          View on GitHub
        </a>
        {onClone && (
          <button
            type="button"
            onClick={() => onClone(repo)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 active:scale-[0.99]"
            title="Select repository"
          >
            <div className="i-ph:git-branch h-4 w-4" />
            Select repository
          </button>
        )}
      </div>
    </article>
  );
}
