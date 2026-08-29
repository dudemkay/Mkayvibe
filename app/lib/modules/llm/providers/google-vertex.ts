import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV1 } from 'ai';
import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import { getGoogleCloudAccessToken } from './google-oauth';
import { getProviderEnvironmentValue } from './provider-environment';
import { parseConfiguredModels } from './provider-models';

export function buildGoogleVertexBaseUrl(
  configuredBaseUrl?: string,
  projectId?: string,
  location = 'global',
): string | undefined {
  if (configuredBaseUrl?.trim()) {
    return configuredBaseUrl.trim().replace(/\/+$/, '');
  }

  if (!projectId?.trim()) {
    return undefined;
  }

  const normalizedLocation = location.trim() || 'global';

  return `https://aiplatform.googleapis.com/v1/projects/${projectId.trim()}/locations/${normalizedLocation}/endpoints/openapi`;
}

export default class GoogleVertexProvider extends BaseProvider {
  name = 'GoogleVertex';
  getApiKeyLink = 'https://console.cloud.google.com/vertex-ai';
  labelForGetApiKey = 'Open Google Vertex AI';

  config = {
    baseUrlKey: 'GOOGLE_VERTEX_BASE_URL',
    apiTokenKey: 'GOOGLE_VERTEX_ACCESS_TOKEN',
    modelsKey: 'GOOGLE_VERTEX_MODELS',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'gemini-3.7-flash',
      label: 'Gemini 3.7 Flash (Vertex)',
      provider: this.name,
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 65536,
    },
    {
      name: 'gemini-3.6-flash',
      label: 'Gemini 3.6 Flash (Vertex)',
      provider: this.name,
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 65536,
    },
    {
      name: 'gemini-3.5-flash',
      label: 'Gemini 3.5 Flash (Vertex)',
      provider: this.name,
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 65536,
    },
    {
      name: 'gemini-3.1-pro-preview',
      label: 'Gemini 3.1 Pro Preview (Vertex)',
      provider: this.name,
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 65536,
    },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const configuredModels = settings?.models || getProviderEnvironmentValue(this.config.modelsKey, serverEnv);

    return parseConfiguredModels(configuredModels, this.name, {
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 65536,
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
    const { baseUrl: configuredBaseUrl, apiKey: providedAccessToken } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: envRecord,
      defaultBaseUrlKey: this.config.baseUrlKey,
      defaultApiTokenKey: this.config.apiTokenKey,
    });

    const projectId = getProviderEnvironmentValue('GOOGLE_VERTEX_PROJECT', envRecord);
    const location = getProviderEnvironmentValue('GOOGLE_VERTEX_LOCATION', envRecord) || 'global';
    const clientEmail = getProviderEnvironmentValue('GOOGLE_VERTEX_CLIENT_EMAIL', envRecord);
    const privateKey = getProviderEnvironmentValue('GOOGLE_VERTEX_PRIVATE_KEY', envRecord);
    const baseURL = buildGoogleVertexBaseUrl(configuredBaseUrl, projectId, location);

    if (!baseURL) {
      throw new Error(
        'Missing Google Vertex endpoint. Set GOOGLE_VERTEX_PROJECT (and optionally GOOGLE_VERTEX_LOCATION) or GOOGLE_VERTEX_BASE_URL.',
      );
    }

    if (!providedAccessToken && (!clientEmail || !privateKey)) {
      throw new Error(
        'Missing Google Vertex credentials. Configure an access token or GOOGLE_VERTEX_CLIENT_EMAIL and GOOGLE_VERTEX_PRIVATE_KEY.',
      );
    }

    const authenticatedFetch: typeof fetch = async (input, init) => {
      const accessToken = await getGoogleCloudAccessToken({
        accessToken: providedAccessToken,
        clientEmail,
        privateKey,
      });
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);

      return fetch(input, {
        ...init,
        headers,
      });
    };

    const vertex = createOpenAI({
      baseURL,
      apiKey: providedAccessToken || 'google-vertex-service-account',
      fetch: authenticatedFetch,
    });

    return vertex(model);
  }
}
