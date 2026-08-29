import { LLMManager } from '~/lib/modules/llm/manager';

export function getProviderEnvironmentValue(key: string, serverEnv: Record<string, string> = {}): string | undefined {
  return serverEnv[key] || process?.env?.[key] || LLMManager.getInstance().env?.[key];
}
