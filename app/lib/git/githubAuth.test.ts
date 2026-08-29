import { describe, expect, it } from 'vitest';
import { buildGitHubProxyAuthorization, resolveGitHubToken, resolveServerGitHubToken } from './githubAuth';

describe('GitHub auth resolution', () => {
  it('prefers the Cloudflare server token over browser or cookie tokens', () => {
    expect(
      resolveGitHubToken({
        bodyToken: 'browser-token',
        apiKeys: { GITHUB_API_KEY: 'cookie-token' },
        cloudflareEnv: { GITHUB_TOKEN: 'server-token' },
      }),
    ).toBe('server-token');
  });

  it('falls back to a browser token when no server token exists', () => {
    expect(
      resolveGitHubToken({
        bodyToken: 'browser-token',
        apiKeys: { GITHUB_API_KEY: 'cookie-token' },
      }),
    ).toBe('browser-token');
  });

  it('resolves only server-side GitHub credentials for proxy use', () => {
    expect(
      resolveServerGitHubToken({
        bodyToken: 'browser-token',
        apiKeys: { GITHUB_API_KEY: 'cookie-token' },
        cloudflareEnv: { GITHUB_TOKEN: 'server-token' },
      }),
    ).toBe('server-token');
  });

  it('injects a server credential only for github.com', () => {
    const authorization = buildGitHubProxyAuthorization('github.com', {
      cloudflareEnv: { GITHUB_TOKEN: 'server-token' },
    });

    expect(authorization).toBe(`Basic ${btoa('x-access-token:server-token')}`);
    expect(buildGitHubProxyAuthorization('gitlab.com', { cloudflareEnv: { GITHUB_TOKEN: 'server-token' } })).toBe('');
  });
});
