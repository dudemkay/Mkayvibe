export interface GitHubTokenSources {
  bodyToken?: string | null;
  apiKeys?: Record<string, string>;
  cloudflareEnv?: Record<string, string | undefined>;
  processEnv?: Record<string, string | undefined>;
}

export function resolveGitHubToken({ bodyToken, apiKeys = {}, cloudflareEnv = {}, processEnv = {} }: GitHubTokenSources) {
  return (
    bodyToken ||
    apiKeys.GITHUB_API_KEY ||
    apiKeys.VITE_GITHUB_ACCESS_TOKEN ||
    cloudflareEnv.GITHUB_TOKEN ||
    cloudflareEnv.VITE_GITHUB_ACCESS_TOKEN ||
    processEnv.GITHUB_TOKEN ||
    processEnv.VITE_GITHUB_ACCESS_TOKEN ||
    ''
  );
}
