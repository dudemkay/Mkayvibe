export const MODEL_CONFIGURABLE_PROVIDERS = ['AzureOpenAI', 'GoogleVertex', 'CloudflareWorkersAI'] as const;

export function isModelConfigurableProvider(name: string) {
  return MODEL_CONFIGURABLE_PROVIDERS.includes(name as (typeof MODEL_CONFIGURABLE_PROVIDERS)[number]);
}
