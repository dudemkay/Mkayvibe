export interface GitHubTokenSources {
  bodyToken?: string | null;
  apiKeys?: Record<string, string>;
  cloudflareEnv?: Record<string, string | undefined>;
  processEnv?: Record<string, string | undefined>;
}

export function resolveServerGitHubToken({ cloudflareEnv = {}, processEnv = {} }: GitHubTokenSources): string {
  return (
    cloudflareEnv.GITHUB_TOKEN ||
    processEnv.GITHUB_TOKEN ||
    cloudflareEnv.VITE_GITHUB_ACCESS_TOKEN ||
    processEnv.VITE_GITHUB_ACCESS_TOKEN ||
    ''
  );
}

export function resolveGitHubToken(sources: GitHubTokenSources): string {
  const { bodyToken, apiKeys = {} } = sources;
  const serverToken = resolveServerGitHubToken(sources);

  return serverToken || bodyToken || apiKeys.GITHUB_API_KEY || apiKeys.VITE_GITHUB_ACCESS_TOKEN || '';
}

export function buildGitHubProxyAuthorization(domain: string, sources: GitHubTokenSources): string {
  if (domain.toLowerCase() !== 'github.com') {
    return '';
  }

  const token = resolveServerGitHubToken(sources);

  if (!token) {
    return '';
  }

  return `Basic ${btoa(`x-access-token:${token}`)}`;
}
