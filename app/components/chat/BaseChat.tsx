/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { JSONValue, Message } from 'ai';
import React, { type RefCallback, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { Workbench } from '~/components/workbench/Workbench.client';
import { MobileWorkspaceNav } from '~/components/mobile/MobileWorkspaceNav';
import { NativeMobileChatBox } from '~/components/mobile/NativeMobileChatBox';
import { NativeMobileWorkspace } from '~/components/mobile/NativeMobileWorkspace';
import type { MobileWorkspaceView } from '~/components/mobile/types';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { Messages } from './Messages.client';
import { getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';
import styles from './BaseChat.module.scss';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import GitCloneButton from './GitCloneButton';
import type { ProviderInfo } from '~/types/model';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert, SupabaseAlert, DeployAlert, LlmErrorAlertType } from '~/types/actions';
import DeployChatAlert from '~/components/deploy/DeployAlert';
import ChatAlert from './ChatAlert';
import type { ModelInfo } from '~/lib/modules/llm/types';
import ProgressCompilation from './ProgressCompilation';
import type { ProgressAnnotation } from '~/types/context';
import { SupabaseChatAlert } from '~/components/chat/SupabaseAlert';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { useStore } from '@nanostores/react';
import useViewport, { StickToBottom, useStickToBottomContext } from '~/lib/hooks';
import { ChatBox } from './ChatBox';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import LlmErrorAlert from './LLMApiAlert';

const TEXTAREA_MIN_HEIGHT = 76;
const MOBILE_VIEW_KEY = 'mkayvibe-mobile-view';

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  onStreamingChange?: (streaming: boolean) => void;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
  supabaseAlert?: SupabaseAlert;
  clearSupabaseAlert?: () => void;
  deployAlert?: DeployAlert;
  clearDeployAlert?: () => void;
  llmErrorAlert?: LlmErrorAlertType;
  clearLlmErrorAlert?: () => void;
  data?: JSONValue[] | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  append?: (message: Message) => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: (element: ElementInfo | null) => void;
  addToolResult?: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
  onWebSearchResult?: (result: string) => void;
}

const isMobileView = (value: string | null): value is MobileWorkspaceView =>
  value === 'chat' || value === 'files' || value === 'code' || value === 'preview' || value === 'git';

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      onStreamingChange,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
      deployAlert,
      clearDeployAlert,
      supabaseAlert,
      clearSupabaseAlert,
      llmErrorAlert,
      clearLlmErrorAlert,
      data,
      chatMode,
      setChatMode,
      append,
      designScheme,
      setDesignScheme,
      selectedElement,
      setSelectedElement,
      addToolResult = () => {
        throw new Error('addToolResult not implemented');
      },
      onWebSearchResult,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState<ModelInfo[]>([]);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [progressAnnotations, setProgressAnnotations] = useState<ProgressAnnotation[]>([]);
    const expoUrl = useStore(expoUrlAtom);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const isSmallViewport = useViewport(1024);
    const [mobileView, setMobileView] = useState<MobileWorkspaceView>(() => {
      if (typeof window === 'undefined') {
        return 'chat';
      }

      const storedView = window.sessionStorage.getItem(MOBILE_VIEW_KEY);
      return isMobileView(storedView) ? storedView : 'chat';
    });

    useEffect(() => {
      if (isSmallViewport) {
        setIsModelSettingsCollapsed(true);
      }
    }, [isSmallViewport]);

    useEffect(() => {
      if (!isSmallViewport || typeof window === 'undefined') {
        return;
      }

      window.sessionStorage.setItem(MOBILE_VIEW_KEY, mobileView);
    }, [isSmallViewport, mobileView]);

    useEffect(() => {
      if (!isSmallViewport || typeof window === 'undefined') {
        return;
      }

      const viewport = window.visualViewport;
      const target = document.documentElement;

      const syncViewportHeight = () => {
        const height = viewport?.height ?? window.innerHeight;
        target.style.setProperty('--mk-mobile-viewport-height', `${Math.round(height)}px`);
      };

      syncViewportHeight();
      viewport?.addEventListener('resize', syncViewportHeight);
      viewport?.addEventListener('scroll', syncViewportHeight);
      window.addEventListener('orientationchange', syncViewportHeight);

      return () => {
        viewport?.removeEventListener('resize', syncViewportHeight);
        viewport?.removeEventListener('scroll', syncViewportHeight);
        window.removeEventListener('orientationchange', syncViewportHeight);
        target.style.removeProperty('--mk-mobile-viewport-height');
      };
    }, [isSmallViewport]);

    useEffect(() => {
      if (expoUrl) {
        setQrModalOpen(true);
      }
    }, [expoUrl]);

    useEffect(() => {
      if (data) {
        const progressList = data.filter(
          (x) => typeof x === 'object' && (x as any).type === 'progress',
        ) as ProgressAnnotation[];
        setProgressAnnotations(progressList);
      }
    }, [data]);

    useEffect(() => {
      onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setTranscript(transcript);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Error loading API keys from cookies:', error);
          Cookies.remove('apiKeys');
        }

        setIsModelLoading('all');
        fetch('/api/models')
          .then((response) => response.json())
          .then((data) => {
            const typedData = data as { modelList: ModelInfo[] };
            setModelList(typedData.modelList);
          })
          .catch((error) => {
            console.error('Error fetching model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      const newApiKeys = { ...apiKeys, [providerName]: apiKey };
      setApiKeys(newApiKeys);
      Cookies.set('apiKeys', JSON.stringify(newApiKeys));

      setIsModelLoading(providerName);

      let providerModels: ModelInfo[] = [];

      try {
        const response = await fetch(`/api/models/${encodeURIComponent(providerName)}`);
        const data = await response.json();
        providerModels = (data as { modelList: ModelInfo[] }).modelList;
      } catch (error) {
        console.error('Error loading dynamic models for:', providerName, error);
      }

      setModelList((prevModels) => {
        const otherModels = prevModels.filter((model) => model.provider !== providerName);
        return [...otherModels, ...providerModels];
      });
      setIsModelLoading(undefined);
    };

    const startListening = () => {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      if (sendMessage) {
        sendMessage(event, messageInput);
        setSelectedElement?.(null);

        if (recognition) {
          recognition.abort();
          setTranscript('');
          setIsListening(false);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        }
      }
    };

    const handleFileUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64Image = event.target?.result as string;
              setUploadedFiles?.([...uploadedFiles, file]);
              setImageDataList?.([...imageDataList, base64Image]);
            };
            reader.readAsDataURL(file);
          }

          break;
        }
      }
    };

    const renderAlerts = () => (
      <div className="flex flex-col gap-2">
        {deployAlert && (
          <DeployChatAlert
            alert={deployAlert}
            clearAlert={() => clearDeployAlert?.()}
            postMessage={(message: string | undefined) => {
              sendMessage?.({} as any, message);
              clearSupabaseAlert?.();
            }}
          />
        )}
        {supabaseAlert && (
          <SupabaseChatAlert
            alert={supabaseAlert}
            clearAlert={() => clearSupabaseAlert?.()}
            postMessage={(message) => {
              sendMessage?.({} as any, message);
              clearSupabaseAlert?.();
            }}
          />
        )}
        {actionAlert && (
          <ChatAlert
            alert={actionAlert}
            clearAlert={() => clearAlert?.()}
            postMessage={(message) => {
              sendMessage?.({} as any, message);
              clearAlert?.();
            }}
          />
        )}
        {llmErrorAlert && <LlmErrorAlert alert={llmErrorAlert} clearAlert={() => clearLlmErrorAlert?.()} />}
      </div>
    );

    const sharedChatBoxProps = {
      isModelSettingsCollapsed,
      setIsModelSettingsCollapsed,
      provider,
      setProvider,
      providerList: providerList || (PROVIDER_LIST as ProviderInfo[]),
      model,
      setModel,
      modelList,
      apiKeys,
      isModelLoading,
      onApiKeysChange,
      uploadedFiles,
      setUploadedFiles,
      imageDataList,
      setImageDataList,
      textareaRef,
      input,
      handleInputChange,
      handlePaste,
      TEXTAREA_MIN_HEIGHT,
      TEXTAREA_MAX_HEIGHT,
      isStreaming,
      handleStop,
      handleSendMessage,
      enhancingPrompt,
      enhancePrompt,
      isListening,
      startListening,
      stopListening,
      chatStarted,
      exportChat,
      qrModalOpen,
      setQrModalOpen,
      handleFileUpload,
      chatMode,
      setChatMode,
      designScheme,
      setDesignScheme,
      selectedElement,
      setSelectedElement,
      onWebSearchResult,
    };

    if (isSmallViewport) {
      const chatSurface = (
        <section
          data-testid="native-mobile-chat-surface"
          className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-bolt-elements-background-depth-1"
        >
          <StickToBottom
            className="relative h-full min-h-0 min-w-0 overflow-y-hidden"
            resize="smooth"
            initial="smooth"
            role="log"
          >
            <StickToBottom.Content className="flex min-h-full min-w-0 flex-col gap-4 p-3 pb-4">
              {!chatStarted ? (
                <div className="flex min-h-full flex-1 flex-col items-center justify-center px-5 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-xl text-bolt-elements-textSecondary">
                    <span className="i-ph:sparkle-fill" aria-hidden="true" />
                  </div>
                  <h1 className="mt-4 max-w-xs text-[1.65rem] font-semibold leading-tight tracking-[-0.035em] text-bolt-elements-textPrimary">
                    What do you want to build?
                  </h1>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-bolt-elements-textSecondary">
                    Describe an idea or open Git to continue working on a repository.
                  </p>
                </div>
              ) : (
                <ClientOnly>
                  {() => (
                    <Messages
                      className="flex w-full min-w-0 flex-1 flex-col pb-2"
                      messages={messages}
                      isStreaming={isStreaming}
                      append={append}
                      chatMode={chatMode}
                      setChatMode={setChatMode}
                      provider={provider}
                      model={model}
                      addToolResult={addToolResult}
                    />
                  )}
                </ClientOnly>
              )}
            </StickToBottom.Content>
          </StickToBottom>

          <div className="shrink-0 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2 pb-2">
            {renderAlerts()}
            {progressAnnotations && progressAnnotations.length > 0 && <ProgressCompilation data={progressAnnotations} />}
            <NativeMobileChatBox {...sharedChatBoxProps} />
          </div>
        </section>
      );

      return (
        <Tooltip.Provider delayDuration={200}>
          <div
            ref={ref}
            data-testid="native-mobile-shell"
            className="relative grid w-full min-w-0 overflow-hidden bg-bolt-elements-background-depth-1"
            style={{
              height: 'calc(var(--mk-mobile-viewport-height, 100dvh) - var(--header-height, 0px))',
              gridTemplateRows: 'minmax(0, 1fr) auto',
            }}
          >
            <ClientOnly>{() => <Menu />}</ClientOnly>
            <main className="relative min-h-0 min-w-0 overflow-hidden">
              {mobileView === 'chat' ? (
                chatSurface
              ) : (
                <ClientOnly>
                  {() => (
                    <NativeMobileWorkspace
                      view={mobileView}
                      onViewChange={setMobileView}
                      chatStarted={chatStarted}
                      isStreaming={isStreaming}
                      setSelectedElement={setSelectedElement}
                    />
                  )}
                </ClientOnly>
              )}
            </main>
            <MobileWorkspaceNav activeView={mobileView} onChange={setMobileView} workspaceReady={chatStarted} />
          </div>
        </Tooltip.Provider>
      );
    }

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full min-w-0 overflow-hidden')}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div className="flex h-full w-full min-w-0 flex-col overflow-x-hidden overflow-y-auto lg:flex-row">
          <div className={classNames(styles.Chat, 'flex h-full min-w-0 flex-grow flex-col lg:min-w-[var(--chat-min-width)]')}>
            {!chatStarted && (
              <div id="intro" className="mx-auto mt-[16vh] max-w-2xl px-4 text-center lg:px-0">
                <h1 className="mb-4 animate-fade-in text-3xl font-bold text-bolt-elements-textPrimary lg:text-6xl">
                  Where ideas begin
                </h1>
                <p className="mb-8 animate-fade-in text-md text-bolt-elements-textSecondary animation-delay-200 lg:text-xl">
                  Bring ideas to life in seconds or get help on existing projects.
                </p>
              </div>
            )}
            <StickToBottom
              className={classNames('relative min-w-0 px-2 pt-6 sm:px-6', {
                'h-full flex flex-col modern-scrollbar': chatStarted,
              })}
              resize="smooth"
              initial="smooth"
            >
              <StickToBottom.Content className="relative flex min-w-0 flex-col gap-4">
                <ClientOnly>
                  {() =>
                    chatStarted ? (
                      <Messages
                        className="z-1 mx-auto flex w-full min-w-0 max-w-chat flex-1 flex-col pb-4"
                        messages={messages}
                        isStreaming={isStreaming}
                        append={append}
                        chatMode={chatMode}
                        setChatMode={setChatMode}
                        provider={provider}
                        model={model}
                        addToolResult={addToolResult}
                      />
                    ) : null
                  }
                </ClientOnly>
                <ScrollToBottom />
              </StickToBottom.Content>
              <div
                className={classNames('z-prompt mx-auto my-auto mb-6 flex w-full min-w-0 max-w-chat flex-col gap-2', {
                  sticky: chatStarted,
                })}
                style={chatStarted ? { bottom: '0.5rem' } : undefined}
              >
                {renderAlerts()}
                {progressAnnotations && <ProgressCompilation data={progressAnnotations} />}
                <ChatBox {...sharedChatBoxProps} />
              </div>
            </StickToBottom>
            <div className="flex flex-col justify-center">
              {!chatStarted && (
                <div className="flex justify-center gap-2">
                  {ImportButtons(importChat)}
                  <GitCloneButton importChat={importChat} />
                </div>
              )}
              <div className="flex flex-col gap-5">
                {!chatStarted &&
                  ExamplePrompts((event, messageInput) => {
                    if (isStreaming) {
                      handleStop?.();
                      return;
                    }

                    handleSendMessage?.(event, messageInput);
                  })}
                {!chatStarted && <StarterTemplates />}
              </div>
            </div>
          </div>
          <ClientOnly>
            {() => (
              <Workbench
                chatStarted={chatStarted}
                isStreaming={isStreaming}
                setSelectedElement={setSelectedElement}
              />
            )}
          </ClientOnly>
        </div>
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    !isAtBottom && (
      <>
        <div className="sticky bottom-0 left-0 right-0 z-10 h-20 bg-gradient-to-t from-bolt-elements-background-depth-1 to-transparent" />
        <button
          className="sticky bottom-0 left-0 right-0 z-50 mx-auto flex items-center justify-center gap-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-1.5 py-0.5 text-sm text-bolt-elements-textPrimary"
          onClick={() => scrollToBottom()}
        >
          Go to last message
          <span className="i-ph:arrow-down animate-bounce" />
        </button>
      </>
    )
  );
}
