import type { ModelInfo } from '~/lib/modules/llm/types';

interface ModelDefaults {
  maxTokenAllowed: number;
  maxCompletionTokens?: number;
}

export function parseConfiguredModels(
  configuredModels: string | undefined,
  provider: string,
  defaults: ModelDefaults,
): ModelInfo[] {
  if (!configuredModels?.trim()) {
    return [];
  }

  const seen = new Set<string>();

  return configuredModels
    .split(/[\n,;]+/)
    .map((model) => model.trim())
    .filter((model) => model.length > 0)
    .filter((model) => {
      if (seen.has(model)) {
        return false;
      }

      seen.add(model);
      return true;
    })
    .map((model) => ({
      name: model,
      label: model,
      provider,
      maxTokenAllowed: defaults.maxTokenAllowed,
      ...(defaults.maxCompletionTokens ? { maxCompletionTokens: defaults.maxCompletionTokens } : {}),
    }));
}
