import { describe, expect, it } from 'vitest';
import CloudflareWorkersAIProvider, { buildCloudflareWorkersAIBaseUrl } from './cloudflare-workers-ai';

describe('CloudflareWorkersAIProvider', () => {
  it('builds the official OpenAI-compatible base URL from an account id', () => {
    expect(buildCloudflareWorkersAIBaseUrl(undefined, 'account-123')).toBe(
      'https://api.cloudflare.com/client/v4/accounts/account-123/ai/v1',
    );
  });

  it('prefers an explicitly configured base URL', () => {
    expect(buildCloudflareWorkersAIBaseUrl('https://example.com/custom/', 'account-123')).toBe(
      'https://example.com/custom',
    );
  });

  it('parses additional configured models', async () => {
    const provider = new CloudflareWorkersAIProvider();
    const models = await provider.getDynamicModels(undefined, { models: '@cf/example/model-a, @cf/example/model-b' }, {});

    expect(models.map((model) => model.name)).toEqual(['@cf/example/model-a', '@cf/example/model-b']);
    expect(models.every((model) => model.provider === 'CloudflareWorkersAI')).toBe(true);
  });
});
