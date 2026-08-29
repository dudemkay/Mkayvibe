import { describe, expect, it } from 'vitest';
import { parseConfiguredModels } from './provider-models';

describe('parseConfiguredModels', () => {
  it('parses comma, semicolon, and newline separated model ids', () => {
    expect(
      parseConfiguredModels('model-a, model-b\nmodel-c;model-d', 'ExampleProvider', {
        maxTokenAllowed: 128000,
        maxCompletionTokens: 8192,
      }),
    ).toEqual([
      {
        name: 'model-a',
        label: 'model-a',
        provider: 'ExampleProvider',
        maxTokenAllowed: 128000,
        maxCompletionTokens: 8192,
      },
      {
        name: 'model-b',
        label: 'model-b',
        provider: 'ExampleProvider',
        maxTokenAllowed: 128000,
        maxCompletionTokens: 8192,
      },
      {
        name: 'model-c',
        label: 'model-c',
        provider: 'ExampleProvider',
        maxTokenAllowed: 128000,
        maxCompletionTokens: 8192,
      },
      {
        name: 'model-d',
        label: 'model-d',
        provider: 'ExampleProvider',
        maxTokenAllowed: 128000,
        maxCompletionTokens: 8192,
      },
    ]);
  });

  it('removes blank and duplicate model ids while preserving order', () => {
    const models = parseConfiguredModels('model-a, ,model-a\nmodel-b', 'ExampleProvider', {
      maxTokenAllowed: 32000,
    });

    expect(models.map((model) => model.name)).toEqual(['model-a', 'model-b']);
  });

  it('returns an empty list when no models are configured', () => {
    expect(parseConfiguredModels(undefined, 'ExampleProvider', { maxTokenAllowed: 32000 })).toEqual([]);
  });
});
