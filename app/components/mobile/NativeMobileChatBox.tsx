import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { toast } from 'react-toastify';
import { ChatBox } from '~/components/chat/ChatBox';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import FilePreview from '~/components/chat/FilePreview';
import { ScreenshotStateManager } from '~/components/chat/ScreenshotStateManager';
import { SendButton } from '~/components/chat/SendButton.client';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from '~/components/chat/SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import { McpTools } from '~/components/chat/MCPTools';
import { WebSearch } from '~/components/chat/WebSearch.client';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import { PROVIDER_LIST } from '~/utils/constants';
import type { ProviderInfo } from '~/types/model';

type NativeMobileChatBoxProps = React.ComponentProps<typeof ChatBox>;

export function NativeMobileChatBox(props: NativeMobileChatBoxProps) {
  const modelSheetOpen = !props.isModelSettingsCollapsed;

  const attachImage = () => props.handleFileUpload();

  return (
    <>
      {modelSheetOpen && (
        <div className="fixed inset-0 z-[700] flex items-end bg-black/45" role="presentation">
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
            className="relative z-10 grid max-h-[76dvh] w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-t-3xl border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-2xl"
          >
            <header className="flex min-h-14 items-center gap-3 border-b border-bolt-elements-borderColor px-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">Model & provider</h2>
                <p className="truncate text-xs text-bolt-elements-textSecondary">{props.model || props.provider?.name || 'Choose model'}</p>
              </div>
              <button
                type="button"
                aria-label="Close model settings"
                onClick={() => props.setIsModelSettingsCollapsed(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary"
              >
                <span className="i-ph:x text-lg" aria-hidden="true" />
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
              {(props.providerList || []).length > 0 &&
                props.provider &&
                !LOCAL_PROVIDERS.includes(props.provider.name) && (
                  <div className="mt-3">
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

      <div
        data-testid="native-mobile-chat-box"
        className="w-full min-w-0 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      >
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
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-bolt-elements-borderColor px-3 py-2 text-xs text-bolt-elements-textPrimary">
            <div className="min-w-0 truncate">
              <code className="mr-1 rounded bg-accent-500 px-1.5 py-1 text-white">{props.selectedElement.tagName}</code>
              selected
            </div>
            <button type="button" className="shrink-0 bg-transparent text-accent-500" onClick={() => props.setSelectedElement?.(null)}>
              Clear
            </button>
          </div>
        )}

        <div className="relative min-w-0 overflow-hidden rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
          <textarea
            ref={props.textareaRef}
            value={props.input}
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

              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }}
            className="block w-full resize-none bg-transparent px-4 pb-3 pr-14 pt-3 text-[16px] leading-6 text-bolt-elements-textPrimary outline-none placeholder:text-bolt-elements-textTertiary"
            style={{ minHeight: 52, maxHeight: 144 }}
            placeholder={props.chatMode === 'build' ? 'Ask Mkayvibe to build…' : 'Message Mkayvibe…'}
            translate="no"
          />
          <ClientOnly>
            {() => (
              <SendButton
                show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                isStreaming={props.isStreaming}
                disabled={!props.providerList || props.providerList.length === 0}
                onClick={(event) => {
                  if (props.isStreaming) {
                    props.handleStop?.();
                    return;
                  }

                  if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                    props.handleSendMessage?.(event);
                  }
                }}
              />
            )}
          </ClientOnly>
        </div>

        <div className="mt-2 flex min-h-10 min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain whitespace-nowrap scrollbar-none">
          <button
            type="button"
            title="Upload file"
            aria-label="Upload file"
            onClick={attachImage}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent text-bolt-elements-textSecondary active:bg-bolt-elements-background-depth-1"
          >
            <span className="i-ph:paperclip text-lg" aria-hidden="true" />
          </button>
          <WebSearch onSearchResult={(result) => props.onWebSearchResult?.(result)} disabled={props.isStreaming} />
          <button
            type="button"
            title="Enhance prompt"
            aria-label="Enhance prompt"
            disabled={props.input.length === 0 || props.enhancingPrompt}
            onClick={() => {
              props.enhancePrompt?.();
              toast.success('Prompt enhanced!');
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent text-bolt-elements-textSecondary disabled:opacity-40 active:bg-bolt-elements-background-depth-1"
          >
            <span className={props.enhancingPrompt ? 'i-svg-spinners:90-ring-with-bg text-lg' : 'i-bolt:stars text-lg'} aria-hidden="true" />
          </button>
          <SpeechRecognitionButton
            isListening={props.isListening}
            onStart={props.startListening}
            onStop={props.stopListening}
            disabled={props.isStreaming}
          />
          <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />
          <McpTools />
          {props.chatStarted && (
            <button
              type="button"
              aria-label="Toggle discuss mode"
              onClick={() => props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss')}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-transparent px-2.5 text-xs text-bolt-elements-textSecondary active:bg-bolt-elements-background-depth-1"
            >
              <span className="i-ph:chats text-lg" aria-hidden="true" />
              {props.chatMode === 'discuss' ? 'Discuss' : 'Build'}
            </button>
          )}
          <button
            type="button"
            aria-label="Choose model"
            onClick={() => props.setIsModelSettingsCollapsed(false)}
            disabled={!props.providerList || props.providerList.length === 0}
            className="flex h-10 max-w-[13rem] shrink-0 items-center gap-1.5 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 text-xs font-medium text-bolt-elements-textPrimary disabled:opacity-50"
          >
            <span className="i-ph:sparkle text-base" aria-hidden="true" />
            <span className="truncate">{props.model || props.provider?.name || 'Model'}</span>
            <span className="i-ph:caret-up-down text-xs" aria-hidden="true" />
          </button>
          <div className="shrink-0 pl-1">
            <SupabaseConnection />
          </div>
        </div>

        <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
      </div>
    </>
  );
}
