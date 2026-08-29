import React, { useEffect, useState, useCallback } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';
import { logStore } from '~/lib/stores/logs';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { providerBaseUrlEnvKeys } from '~/utils/constants';
import { SiAmazon, SiGoogle, SiGithub, SiHuggingface, SiPerplexity, SiOpenai } from 'react-icons/si';
import { BsRobot, BsCloud } from 'react-icons/bs';
import { TbBrain, TbCloudComputing } from 'react-icons/tb';
import { BiCodeBlock, BiChip } from 'react-icons/bi';
import { FaCloud, FaBrain } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { isModelConfigurableProvider } from './providerUiConfig';

type ProviderName =
  | 'AmazonBedrock'
  | 'Anthropic'
  | 'AzureOpenAI'
  | 'CloudflareWorkersAI'
  | 'Cohere'
  | 'Deepseek'
  | 'Github'
  | 'Google'
  | 'GoogleVertex'
  | 'Groq'
  | 'HuggingFace'
  | 'Hyperbolic'
  | 'Mistral'
  | 'OpenAI'
  | 'OpenRouter'
  | 'Perplexity'
  | 'Together'
  | 'XAI';

const PROVIDER_ICONS: Record<ProviderName, IconType> = {
  AmazonBedrock: SiAmazon,
  Anthropic: FaBrain,
  AzureOpenAI: BsCloud,
  CloudflareWorkersAI: FaCloud,
  Cohere: BiChip,
  Deepseek: BiCodeBlock,
  Github: SiGithub,
  Google: SiGoogle,
  GoogleVertex: SiGoogle,
  Groq: BsCloud,
  HuggingFace: SiHuggingface,
  Hyperbolic: TbCloudComputing,
  Mistral: TbBrain,
  OpenAI: SiOpenai,
  OpenRouter: FaCloud,
  Perplexity: SiPerplexity,
  Together: BsCloud,
  XAI: BsRobot,
};

const PROVIDER_DESCRIPTIONS: Partial<Record<ProviderName, string>> = {
  Anthropic: 'Access Claude and other Anthropic models',
  AzureOpenAI: 'Use Azure-hosted OpenAI deployments through Microsoft Foundry',
  CloudflareWorkersAI: 'Use Cloudflare Workers AI through its OpenAI-compatible endpoint',
  Github: 'Use OpenAI models hosted through GitHub infrastructure',
  GoogleVertex: 'Use Gemini and other models through Google Vertex AI',
  OpenAI: 'Use GPT models directly through OpenAI',
};

const CloudProvidersTab = () => {
  const settings = useSettings();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editingModelsProvider, setEditingModelsProvider] = useState<string | null>(null);
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);
  const [categoryEnabled, setCategoryEnabled] = useState<boolean>(false);

  useEffect(() => {
    const newFilteredProviders = Object.entries(settings.providers || {})
      .filter(([key]) => !['Ollama', 'LMStudio', 'OpenAILike'].includes(key))
      .map(([key, value]) => ({
        name: key,
        settings: value.settings,
        staticModels: value.staticModels || [],
        getDynamicModels: value.getDynamicModels,
        getApiKeyLink: value.getApiKeyLink,
        labelForGetApiKey: value.labelForGetApiKey,
        icon: value.icon,
      }));

    const sorted = newFilteredProviders.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredProviders(sorted);
    setCategoryEnabled(sorted.length > 0 && sorted.every((provider) => provider.settings.enabled));
  }, [settings.providers]);

  const handleToggleCategory = useCallback(
    (enabled: boolean) => {
      filteredProviders.forEach((provider) => {
        settings.updateProviderSettings(provider.name, { ...provider.settings, enabled });
      });

      setCategoryEnabled(enabled);
      toast.success(enabled ? 'All cloud providers enabled' : 'All cloud providers disabled');
    },
    [filteredProviders, settings],
  );

  const handleToggleProvider = useCallback(
    (provider: IProviderConfig, enabled: boolean) => {
      settings.updateProviderSettings(provider.name, { ...provider.settings, enabled });

      logStore.logProvider(`Provider ${provider.name} ${enabled ? 'enabled' : 'disabled'}`, {
        provider: provider.name,
      });
      toast.success(`${provider.name} ${enabled ? 'enabled' : 'disabled'}`);
    },
    [settings],
  );

  const handleUpdateBaseUrl = useCallback(
    (provider: IProviderConfig, baseUrl: string) => {
      const newBaseUrl = baseUrl.trim() || undefined;
      settings.updateProviderSettings(provider.name, { ...provider.settings, baseUrl: newBaseUrl });

      logStore.logProvider(`Base URL updated for ${provider.name}`, {
        provider: provider.name,
        baseUrl: newBaseUrl,
      });
      toast.success(`${provider.name} endpoint updated`);
      setEditingProvider(null);
    },
    [settings],
  );

  const handleUpdateModels = useCallback(
    (provider: IProviderConfig, models: string) => {
      const configuredModels = models.trim() || undefined;
      settings.updateProviderSettings(provider.name, { ...provider.settings, models: configuredModels });
      toast.success(`${provider.name} models updated`);
      setEditingModelsProvider(null);
    },
    [settings],
  );

  return (
    <div className="space-y-6">
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between gap-4 mt-8 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={classNames(
                'w-8 h-8 flex items-center justify-center rounded-lg',
                'bg-bolt-elements-background-depth-3',
                'text-purple-500',
              )}
            >
              <TbCloudComputing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-md font-medium text-bolt-elements-textPrimary">Cloud Providers</h4>
              <p className="text-sm text-bolt-elements-textSecondary">Connect to cloud-based AI models and services</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-bolt-elements-textSecondary">Enable All Cloud</span>
            <Switch checked={categoryEnabled} onCheckedChange={handleToggleCategory} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProviders.map((provider, index) => {
            const endpointConfigurable =
              URL_CONFIGURABLE_PROVIDERS.includes(provider.name) || isModelConfigurableProvider(provider.name);
            const modelConfigurable = isModelConfigurableProvider(provider.name);

            return (
              <motion.div
                key={provider.name}
                className={classNames(
                  'rounded-lg border bg-bolt-elements-background text-bolt-elements-textPrimary shadow-sm',
                  'bg-bolt-elements-background-depth-2',
                  'hover:bg-bolt-elements-background-depth-3',
                  'transition-all duration-200',
                  'relative overflow-hidden group',
                  'flex flex-col',
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="absolute top-0 right-0 p-2 flex gap-1">
                  {(endpointConfigurable || modelConfigurable) && (
                    <motion.span
                      className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-500 font-medium"
                      whileHover={{ scale: 1.05 }}
                    >
                      Configurable
                    </motion.span>
                  )}
                </div>

                <div className="flex items-start gap-4 p-4">
                  <motion.div
                    className={classNames(
                      'w-10 h-10 flex items-center justify-center rounded-xl',
                      'bg-bolt-elements-background-depth-3 group-hover:bg-bolt-elements-background-depth-4',
                      'transition-all duration-200',
                      provider.settings.enabled ? 'text-purple-500' : 'text-bolt-elements-textSecondary',
                    )}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="w-6 h-6 transition-transform duration-200 group-hover:rotate-12">
                      {React.createElement(PROVIDER_ICONS[provider.name as ProviderName] || BsRobot, {
                        className: 'w-full h-full',
                        'aria-label': `${provider.name} logo`,
                      })}
                    </div>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="pr-16">
                        <h4 className="text-sm font-medium text-bolt-elements-textPrimary group-hover:text-purple-500 transition-colors">
                          {provider.name}
                        </h4>
                        <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
                          {PROVIDER_DESCRIPTIONS[provider.name as ProviderName] ||
                            (endpointConfigurable
                              ? 'Configure a custom endpoint for this provider'
                              : 'Standard AI provider integration')}
                        </p>
                      </div>
                      <Switch
                        checked={provider.settings.enabled}
                        onCheckedChange={(checked) => handleToggleProvider(provider, checked)}
                      />
                    </div>

                    {provider.settings.enabled && endpointConfigurable && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-1 text-xs font-medium text-bolt-elements-textSecondary">Endpoint</div>
                          {editingProvider === provider.name ? (
                            <input
                              type="text"
                              defaultValue={provider.settings.baseUrl}
                              placeholder={`Enter ${provider.name} base URL`}
                              className={classNames(
                                'w-full px-3 py-2 rounded-lg text-sm',
                                'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
                                'text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary',
                                'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
                              )}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  handleUpdateBaseUrl(provider, event.currentTarget.value);
                                } else if (event.key === 'Escape') {
                                  setEditingProvider(null);
                                }
                              }}
                              onBlur={(event) => handleUpdateBaseUrl(provider, event.target.value)}
                              autoFocus
                            />
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-lg bg-bolt-elements-background-depth-3 px-3 py-2 text-left text-sm text-bolt-elements-textSecondary hover:text-purple-500"
                              onClick={() => setEditingProvider(provider.name)}
                            >
                              <span className="i-ph:link mr-2 inline-block" />
                              {provider.settings.baseUrl || 'Click to set endpoint'}
                            </button>
                          )}
                        </div>

                        {modelConfigurable && (
                          <div>
                            <div className="mb-1 text-xs font-medium text-bolt-elements-textSecondary">
                              Models / deployment IDs
                            </div>
                            {editingModelsProvider === provider.name ? (
                              <input
                                type="text"
                                defaultValue={provider.settings.models}
                                placeholder="Comma-separated model or deployment IDs"
                                className={classNames(
                                  'w-full px-3 py-2 rounded-lg text-sm',
                                  'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
                                  'text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary',
                                  'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
                                )}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    handleUpdateModels(provider, event.currentTarget.value);
                                  } else if (event.key === 'Escape') {
                                    setEditingModelsProvider(null);
                                  }
                                }}
                                onBlur={(event) => handleUpdateModels(provider, event.target.value)}
                                autoFocus
                              />
                            ) : (
                              <button
                                type="button"
                                className="w-full rounded-lg bg-bolt-elements-background-depth-3 px-3 py-2 text-left text-sm text-bolt-elements-textSecondary hover:text-purple-500"
                                onClick={() => setEditingModelsProvider(provider.name)}
                              >
                                <span className="i-ph:stack mr-2 inline-block" />
                                {provider.settings.models || 'Click to set models'}
                              </button>
                            )}
                            <p className="mt-1 text-[11px] leading-4 text-bolt-elements-textTertiary">
                              Use comma-separated IDs. Azure expects deployment names; Vertex and Workers AI expect provider model IDs.
                            </p>
                          </div>
                        )}

                        {providerBaseUrlEnvKeys[provider.name]?.baseUrlKey && (
                          <div className="text-xs text-green-500">
                            <div className="flex items-center gap-1">
                              <div className="i-ph:info" />
                              <span>Environment configuration is also supported.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  className="absolute inset-0 border-2 border-purple-500/0 rounded-lg pointer-events-none"
                  animate={{
                    borderColor: provider.settings.enabled ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0)',
                    scale: provider.settings.enabled ? 1 : 0.98,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default CloudProvidersTab;
