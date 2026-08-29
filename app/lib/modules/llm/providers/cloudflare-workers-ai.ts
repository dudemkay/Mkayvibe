import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV1 } from 'ai';
import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import { getProviderEnvironmentValue } from './provider-environment';
import { parseConfiguredModels } from './provider-models';

export function buildCloudflareWorkersAIBaseUrl(configuredBaseUrl?: string, accountId?: string): string | undefined {
  if (configuredBaseUrl?.trim()) {
    return configuredBaseUrl.trim().replace(/\/+$/, '');
  }

  if (!accountId?.trim()) {
    return undefined;
  }

  return `https://api.cloudflare.com/client/v4/accounts/${accountId.trim()}/ai/v1`;
}

export default class CloudflareWorkersAIProvider extends BaseProvider {
  name = 'CloudflareWorkersAI';
  getApiKeyLink = 'https://dash.cloudflare.com/profile/api-tokens';
  labelForGetApiKey = 'Get Cloudflare API Token';

  config = {
    baseUrlKey: 'CLOUDFLARE_WORKERS_AI_BASE_URL',
    apiTokenKey: 'CLOUDFLARE_API_TOKEN',
    modelsKey: 'CLOUDFLARE_WORKERS_AI_MODELS',
  };

  staticModels: ModelInfo[] = [
    {
      name: '@cf/moonshotai/kimi-k2.7-code',
      label: 'Kimi K2.7 Code',
      provider: this.name,
      maxTokenAllowed: 262144,
      maxCompletionTokens: 32768,
    },
    {
      name: '@cf/openai/gpt-oss-120b',
      label: 'GPT-OSS 120B',
      provider: this.name,
      maxTokenAllowed: 128000,
      maxCompletionTokens: 32768,
    },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const configuredModels =
      settings?.models || getProviderEnvironmentValue(this.config.modelsKey, serverEnv);

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
    const settings = providerSettings?.[this.name];
    const { baseUrl: configuredBaseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: envRecord,
      defaultBaseUrlKey: this.config.baseUrlKey,
      defaultApiTokenKey: this.config.apiTokenKey,
    });
    const accountId = getProviderEnvironmentValue('CLOUDFLARE_ACCOUNT_ID', envRecord);
    const baseURL = buildCloudflareWorkersAIBaseUrl(configuredBaseUrl, accountId);

    if (!apiKey) {
      throw new Error('Missing Cloudflare API token for CloudflareWorkersAI provider');
    }

    if (!baseURL) {
      throw new Error(
        'Missing Cloudflare Workers AI endpoint. Set CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_WORKERS_AI_BASE_URL.',
      );
    }

    const cloudflare = createOpenAI({
      baseURL,
      apiKey,
    });

    return cloudflare(model);
  }
}
