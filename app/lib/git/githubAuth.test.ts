import { describe, expect, it } from 'vitest';
import { resolveGitHubToken } from './githubAuth';

describe('resolveGitHubToken', () => {
  it('prefers an explicit browser token', () => {
    expect(
      resolveGitHubToken({
        bodyToken: 'browser-token',
        apiKeys: { GITHUB_API_KEY: 'cookie-token' },
        cloudflareEnv: { GITHUB_TOKEN: 'server-token' },
      }),
    ).toBe('browser-token');
  });

  it('falls back to a server-side token when the browser token is absent', () => {
    expect(
      resolveGitHubToken({
        bodyToken: '',
        apiKeys: {},
        cloudflareEnv: { VITE_GITHUB_ACCESS_TOKEN: 'server-token' },
      }),
    ).toBe('server-token');
  });
});
