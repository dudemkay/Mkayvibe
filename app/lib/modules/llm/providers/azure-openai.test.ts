import { describe, expect, it } from 'vitest';
import AzureOpenAIProvider, { buildAzureOpenAIBaseUrl } from './azure-openai';

describe('AzureOpenAIProvider', () => {
  it('normalizes a resource endpoint to the Azure OpenAI v1 base URL', () => {
    expect(buildAzureOpenAIBaseUrl('https://example-resource.openai.azure.com/')).toBe(
      'https://example-resource.openai.azure.com/openai/v1',
    );
  });

  it('does not append the v1 path twice', () => {
    expect(buildAzureOpenAIBaseUrl('https://example-resource.openai.azure.com/openai/v1/')).toBe(
      'https://example-resource.openai.azure.com/openai/v1',
    );
  });

  it('uses configured Azure deployment/model ids', async () => {
    const provider = new AzureOpenAIProvider();
    const models = await provider.getDynamicModels(undefined, { models: 'coding-deployment, fast-deployment' }, {});

    expect(models.map((model) => model.name)).toEqual(['coding-deployment', 'fast-deployment']);
    expect(models.every((model) => model.provider === 'AzureOpenAI')).toBe(true);
  });
});
