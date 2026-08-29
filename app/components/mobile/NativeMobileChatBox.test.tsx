// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('~/components/chat/ModelSelector', () => ({ ModelSelector: () => <div>Model picker content</div> }));
vi.mock('~/components/chat/APIKeyManager', () => ({ APIKeyManager: () => <div>API key manager</div> }));
vi.mock('~/components/chat/FilePreview', () => ({ default: () => null }));
vi.mock('~/components/chat/ScreenshotStateManager', () => ({ ScreenshotStateManager: () => null }));
vi.mock('~/components/chat/SpeechRecognition', () => ({ SpeechRecognitionButton: () => <button type="button">Voice legacy</button> }));
vi.mock('~/components/chat/SupabaseConnection', () => ({ SupabaseConnection: () => <div>Supabase control</div> }));
vi.mock('~/components/workbench/ExpoQrModal', () => ({ ExpoQrModal: () => null }));
vi.mock('~/components/ui/ColorSchemeDialog', () => ({ ColorSchemeDialog: () => <div>Theme control</div> }));
vi.mock('~/components/chat/MCPTools', () => ({ McpTools: () => <div>MCP control</div> }));
vi.mock('~/components/chat/WebSearch.client', () => ({ WebSearch: () => <button type="button">Web search legacy</button> }));
vi.mock('~/lib/stores/settings', () => ({ LOCAL_PROVIDERS: [] }));
vi.mock('~/utils/constants', () => ({ PROVIDER_LIST: [] }));

import { NativeMobileChatBox } from './NativeMobileChatBox.client';

const props = {
  isModelSettingsCollapsed: true,
  setIsModelSettingsCollapsed: vi.fn(),
  provider: { name: 'GoogleVertex' },
  setProvider: vi.fn(),
  providerList: [{ name: 'GoogleVertex' }],
  model: 'google/gemini-2.5-flash',
  setModel: vi.fn(),
  modelList: [],
  apiKeys: {},
  isModelLoading: undefined,
  onApiKeysChange: vi.fn(),
  uploadedFiles: [],
  setUploadedFiles: vi.fn(),
  imageDataList: [],
  setImageDataList: vi.fn(),
  textareaRef: { current: null },
  input: '',
  handleInputChange: vi.fn(),
  handlePaste: vi.fn(),
  isStreaming: false,
  handleStop: vi.fn(),
  handleSendMessage: vi.fn(),
  enhancingPrompt: false,
  enhancePrompt: vi.fn(),
  isListening: false,
  startListening: vi.fn(),
  stopListening: vi.fn(),
  chatStarted: true,
  qrModalOpen: false,
  setQrModalOpen: vi.fn(),
  handleFileUpload: vi.fn(),
  chatMode: 'build',
  setChatMode: vi.fn(),
  selectedElement: null,
  setSelectedElement: vi.fn(),
  onWebSearchResult: vi.fn(),
} as any;

describe('NativeMobileChatBox', () => {
  it('keeps the main composer compact and moves advanced tools into a sheet', () => {
    render(<NativeMobileChatBox {...props} />);

    expect(screen.getByRole('button', { name: 'More tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose model' })).toBeInTheDocument();
    expect(screen.queryByText('Web search legacy')).not.toBeInTheDocument();
    expect(screen.queryByText('MCP control')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More tools' }));

    expect(screen.getByRole('dialog', { name: 'Chat tools' })).toBeInTheDocument();
    expect(screen.getByText('Web search legacy')).toBeInTheDocument();
    expect(screen.getByText('MCP control')).toBeInTheDocument();
  });

  it('uses a full-size in-flow send button instead of an absolutely positioned desktop button', () => {
    render(<NativeMobileChatBox {...props} input="Hello" />);

    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send).toHaveClass('shrink-0');
    expect(send).not.toHaveClass('absolute');
  });
});
