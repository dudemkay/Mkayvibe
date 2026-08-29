import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV1 } from 'ai';
import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import { getProviderEnvironmentValue } from './provider-environment';
import { parseConfiguredModels } from './provider-models';

export function buildAzureOpenAIBaseUrl(configuredBaseUrl?: string): string | undefined {
  if (!configuredBaseUrl?.trim()) {
    return undefined;
  }

  const normalized = configuredBaseUrl.trim().replace(/\/+$/, '');

  if (normalized.endsWith('/openai/v1')) {
    return normalized;
  }

  return `${normalized}/openai/v1`;
}

export default class AzureOpenAIProvider extends BaseProvider {
  name = 'AzureOpenAI';
  getApiKeyLink = 'https://ai.azure.com/';
  labelForGetApiKey = 'Open Microsoft Foundry';

  config = {
    baseUrlKey: 'AZURE_OPENAI_BASE_URL',
    apiTokenKey: 'AZURE_OPENAI_API_KEY',
    modelsKey: 'AZURE_OPENAI_MODELS',
  };

  staticModels: ModelInfo[] = [];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const configuredModels = settings?.models || getProviderEnvironmentValue(this.config.modelsKey, serverEnv);

    return parseConfiguredModels(configuredModels, this.name, {
      maxTokenAllowed: 128000,
      maxCompletionTokens: 32768,
    });
  }

  getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;
    const envRecord = this.convertEnvToRecord(serverEnv);
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: this.config.baseUrlKey,
      defaultApiTokenKey: this.config.apiTokenKey,
    });
    const baseURL = buildAzureOpenAIBaseUrl(baseUrl);

    if (!apiKey) {
      throw new Error('Missing Azure OpenAI API key');
    }

    if (!baseURL) {
      throw new Error('Missing Azure OpenAI endpoint. Set AZURE_OPENAI_BASE_URL or configure a provider base URL.');
    }

    const azure = createOpenAI({
      baseURL,
      apiKey,
      headers: {
        'api-key': apiKey,
      },
    });

    return azure(model);
  }
}
