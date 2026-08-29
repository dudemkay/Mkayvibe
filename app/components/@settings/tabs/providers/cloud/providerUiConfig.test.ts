import { describe, expect, it } from 'vitest';
import { MODEL_CONFIGURABLE_PROVIDERS } from './providerUiConfig';

describe('cloud provider UI configuration', () => {
  it('allows model/deployment IDs for Mkayvibe custom cloud providers', () => {
    expect(MODEL_CONFIGURABLE_PROVIDERS).toEqual(
      expect.arrayContaining(['AzureOpenAI', 'GoogleVertex', 'CloudflareWorkersAI']),
    );
  });
});
