import React, { useMemo, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { toast } from 'react-toastify';
import { ChatBox } from '~/components/chat/ChatBox';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import FilePreview from '~/components/chat/FilePreview';
import { ScreenshotStateManager } from '~/components/chat/ScreenshotStateManager';
import { SupabaseConnection } from '~/components/chat/SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import { McpTools } from '~/components/chat/MCPTools';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import { PROVIDER_LIST } from '~/utils/constants';
import type { ProviderInfo } from '~/types/model';

type NativeMobileChatBoxProps = React.ComponentProps<typeof ChatBox>;

interface WebSearchData {
  title: string;
  description: string;
  content: string;
  sourceUrl: string;
}

interface WebSearchResponse {
  success: boolean;
  data?: WebSearchData;
  error?: string;
}

function formatWebResult(data: WebSearchData) {
  const parts = [`[Web content from ${data.sourceUrl}]`];

  if (data.title) {
    parts.push(`Title: ${data.title}`);
  }

  if (data.description) {
    parts.push(`Description: ${data.description}`);
  }

  parts.push('', data.content);
  return parts.join('\n');
}

export function NativeMobileChatBox(props: NativeMobileChatBoxProps) {
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [isFetchingWeb, setIsFetchingWeb] = useState(false);
  const modelSheetOpen = !props.isModelSettingsCollapsed;
  const currentModelLabel = useMemo(
    () => props.modelList.find((item) => item.name === props.model)?.label || props.model || props.provider?.name || 'Model',
    [props.model, props.modelList, props.provider?.name],
  );
  const canSend = Boolean(props.input.trim() || props.uploadedFiles.length > 0 || props.isStreaming);

  const fetchWebPage = async () => {
    const url = webUrl.trim();

    if (!url) {
      return;
    }

    setIsFetchingWeb(true);

    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const result = (await response.json()) as WebSearchResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch URL content');
      }

      props.onWebSearchResult?.(formatWebResult(result.data));
      setWebUrl('');
      toast.success('URL content added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch URL');
    } finally {
      setIsFetchingWeb(false);
    }
  };

  return (
    <>
      {modelSheetOpen && (
        <div className="fixed inset-0 z-[720] flex items-end bg-black/45" role="presentation">
          <button
            type="button"
            aria-label="Close model settings"
            className="absolute inset-0 cursor-default bg-transparent"
            onClick={() => props.setIsModelSettingsCollapsed(true)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Model settings"
            className="relative z-10 grid max-h-[82dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-t-[28px] border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-2xl"
          >
            <header className="flex min-h-14 items-center gap-3 border-b border-bolt-elements-borderColor px-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">Model & provider</h2>
                <p className="truncate text-xs text-bolt-elements-textSecondary">{currentModelLabel}</p>
              </div>
              <button
                type="button"
                aria-label="Close model settings"
                onClick={() => props.setIsModelSettingsCollapsed(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary"
              >
                <span className="i-ph:x text-lg" aria-hidden="true" />
              </button>
            </header>
            <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="min-w-0 overflow-hidden">
                <ModelSelector
                  key={`${props.provider?.name}:${props.modelList.length}:mobile`}
                  model={props.model}
                  setModel={(model) => {
                    props.setModel?.(model);
                    props.setIsModelSettingsCollapsed(true);
                  }}
                  modelList={props.modelList}
                  provider={props.provider}
                  setProvider={props.setProvider}
                  providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                  apiKeys={props.apiKeys}
                  modelLoading={props.isModelLoading}
                />
              </div>
              {(props.providerList || []).length > 0 &&
                props.provider &&
                !LOCAL_PROVIDERS.includes(props.provider.name) && (
                  <div className="mt-3 min-w-0 overflow-hidden">
                    <APIKeyManager
                      provider={props.provider}
                      apiKey={props.apiKeys[props.provider.name] || ''}
                      setApiKey={(key) => props.onApiKeysChange(props.provider.name, key)}
                    />
                  </div>
                )}
            </div>
          </section>
        </div>
      )}

      {toolsSheetOpen && (
        <div className="fixed inset-0 z-[710] flex items-end bg-black/45" role="presentation">
          <button
            type="button"
            aria-label="Close chat tools"
            className="absolute inset-0 cursor-default bg-transparent"
            onClick={() => setToolsSheetOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Chat tools"
            className="relative z-10 grid max-h-[76dvh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-t-[28px] border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-2xl"
          >
            <header className="flex min-h-14 items-center gap-3 border-b border-bolt-elements-borderColor px-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">Chat tools</h2>
                <p className="text-xs text-bolt-elements-textSecondary">Attachments, web, voice and integrations</p>
              </div>
              <button
                type="button"
                aria-label="Close chat tools"
                onClick={() => setToolsSheetOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary"
              >
                <span className="i-ph:x text-lg" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="grid gap-2">
                <button
                  type="button"
                  aria-label="Upload file"
                  onClick={() => {
                    props.handleFileUpload();
                    setToolsSheetOpen(false);
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 text-left text-sm text-bolt-elements-textPrimary"
                >
                  <span className="i-ph:paperclip text-xl" aria-hidden="true" />
                  <span>Upload image</span>
                </button>

                <div className="rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3">
                  <label htmlFor="mobile-web-page-url" className="text-xs font-medium text-bolt-elements-textSecondary">
                    Web page URL
                  </label>
                  <div className="mt-2 flex min-w-0 gap-2">
                    <input
                      id="mobile-web-page-url"
                      aria-label="Web page URL"
                      type="url"
                      inputMode="url"
                      value={webUrl}
                      onChange={(event) => setWebUrl(event.target.value)}
                      placeholder="https://example.com"
                      className="h-11 min-w-0 flex-1 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 text-[16px] text-bolt-elements-textPrimary outline-none placeholder:text-bolt-elements-textTertiary"
                    />
                    <button
                      type="button"
                      onClick={() => void fetchWebPage()}
                      disabled={!webUrl.trim() || isFetchingWeb}
                      className="h-11 shrink-0 rounded-xl bg-accent-500 px-3 text-sm font-medium text-white disabled:opacity-40"
                    >
                      {isFetchingWeb ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!props.input.trim() || props.enhancingPrompt}
                  onClick={() => {
                    props.enhancePrompt?.();
                    toast.success('Prompt enhanced!');
                    setToolsSheetOpen(false);
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 text-left text-sm text-bolt-elements-textPrimary disabled:opacity-40"
                >
                  <span className={props.enhancingPrompt ? 'i-svg-spinners:90-ring-with-bg text-xl' : 'i-bolt:stars text-xl'} aria-hidden="true" />
                  <span>Enhance prompt</span>
                </button>

                <button
                  type="button"
                  onClick={() => (props.isListening ? props.stopListening?.() : props.startListening?.())}
                  disabled={props.isStreaming}
                  className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 text-left text-sm text-bolt-elements-textPrimary disabled:opacity-40"
                >
                  <span className={props.isListening ? 'i-ph:microphone-slash text-xl' : 'i-ph:microphone text-xl'} aria-hidden="true" />
                  <span>{props.isListening ? 'Stop dictation' : 'Start dictation'}</span>
                </button>

                {props.chatStarted && (
                  <button
                    type="button"
                    onClick={() => props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss')}
                    className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 text-left text-sm text-bolt-elements-textPrimary"
                  >
                    <span className="i-ph:chats text-xl" aria-hidden="true" />
                    <span>{props.chatMode === 'discuss' ? 'Switch to Build mode' : 'Switch to Discuss mode'}</span>
                  </button>
                )}
              </div>

              <div className="mt-5 border-t border-bolt-elements-borderColor pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-bolt-elements-textTertiary">Integrations</p>
                <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3">
                  <div className="min-w-11"><ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} /></div>
                  <div className="min-w-11"><McpTools /></div>
                  <div className="min-w-11"><SupabaseConnection /></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <div data-testid="native-mobile-chat-box" className="w-full min-w-0">
        <FilePreview
          files={props.uploadedFiles}
          imageDataList={props.imageDataList}
          onRemove={(index) => {
            props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
            props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
          }}
        />

        <ClientOnly>
          {() => (
            <ScreenshotStateManager
              setUploadedFiles={props.setUploadedFiles}
              setImageDataList={props.setImageDataList}
              uploadedFiles={props.uploadedFiles}
              imageDataList={props.imageDataList}
            />
          )}
        </ClientOnly>

        {props.selectedElement && (
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-2 text-xs text-bolt-elements-textPrimary">
            <div className="min-w-0 truncate">
              <code className="mr-1 rounded bg-accent-500 px-1.5 py-1 text-white">{props.selectedElement.tagName}</code>
              selected
            </div>
            <button type="button" className="h-9 shrink-0 rounded-lg px-2 text-accent-500" onClick={() => props.setSelectedElement?.(null)}>
              Clear
            </button>
          </div>
        )}

        <div className="min-w-0 rounded-[24px] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-2 shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
          <textarea
            ref={props.textareaRef}
            value={props.input}
            rows={1}
            onChange={(event) => props.handleInputChange?.(event)}
            onPaste={props.handlePaste}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              if (!event.nativeEvent.isComposing && (props.input.trim() || props.uploadedFiles.length > 0)) {
                props.handleSendMessage?.(event);
              }
            }}
            className="block max-h-32 min-h-12 w-full min-w-0 resize-none overflow-y-auto bg-transparent px-3 py-3 text-[16px] leading-6 text-bolt-elements-textPrimary outline-none placeholder:text-bolt-elements-textTertiary"
            placeholder={props.chatMode === 'build' ? 'Ask Mkayvibe to build…' : 'Message Mkayvibe…'}
            translate="no"
          />

          <div className="mt-1 flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="More tools"
              onClick={() => setToolsSheetOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary active:bg-bolt-elements-background-depth-3"
            >
              <span className="i-ph:plus text-xl" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="Choose model"
              onClick={() => props.setIsModelSettingsCollapsed(false)}
              disabled={!props.providerList || props.providerList.length === 0}
              className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-bolt-elements-background-depth-1 px-3 text-left text-xs font-medium text-bolt-elements-textPrimary disabled:opacity-50"
            >
              <span className="i-ph:sparkle shrink-0 text-base" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{currentModelLabel}</span>
              <span className="i-ph:caret-up-down shrink-0 text-xs" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label={props.isStreaming ? 'Stop response' : 'Send message'}
              onClick={(event) => {
                event.preventDefault();

                if (props.isStreaming) {
                  props.handleStop?.();
                  return;
                }

                if (props.input.trim() || props.uploadedFiles.length > 0) {
                  props.handleSendMessage?.(event);
                }
              }}
              disabled={!canSend || (!props.isStreaming && (!props.providerList || props.providerList.length === 0))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition-opacity disabled:opacity-35"
            >
              <span className={props.isStreaming ? 'i-ph:stop-fill text-lg' : 'i-ph:arrow-up-bold text-lg'} aria-hidden="true" />
            </button>
          </div>
        </div>

        <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
      </div>
    </>
  );
}
