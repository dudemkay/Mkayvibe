export interface GitHubRepositoryRef {
  owner: string;
  repo: string;
}

export function parseGitHubRepository(remoteUrl: string | null | undefined): GitHubRepositoryRef | null {
  if (!remoteUrl) {
    return null;
  }

  const normalized = remoteUrl.trim().replace(/#.*$/, '').replace(/\.git$/, '').replace(/\/+$/, '');
  const httpsMatch = normalized.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i);

  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  const sshMatch = normalized.match(/^(?:ssh:\/\/)?git@github\.com[:/]([^/]+)\/([^/]+)$/i);

  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}
