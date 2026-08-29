// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('~/components/chat/APIKeyManager', () => ({ APIKeyManager: () => <div>API key manager</div> }));
vi.mock('~/components/chat/FilePreview', () => ({ default: () => null }));
vi.mock('~/components/chat/ScreenshotStateManager', () => ({ ScreenshotStateManager: () => null }));
vi.mock('~/components/chat/SupabaseConnection', () => ({ SupabaseConnection: () => <div>Supabase control</div> }));
vi.mock('~/components/workbench/ExpoQrModal', () => ({ ExpoQrModal: () => null }));
vi.mock('~/components/ui/ColorSchemeDialog', () => ({ ColorSchemeDialog: () => <div>Theme control</div> }));
vi.mock('~/components/chat/MCPTools', () => ({ McpTools: () => <div>MCP control</div> }));
vi.mock('~/lib/stores/settings', () => ({ LOCAL_PROVIDERS: [] }));
vi.mock('~/utils/constants', () => ({ PROVIDER_LIST: [] }));

import { NativeMobileChatBox } from './NativeMobileChatBox.client';

const props = {
  isModelSettingsCollapsed: true,
  setIsModelSettingsCollapsed: vi.fn(),
  provider: { name: 'GoogleVertex' },
  setProvider: vi.fn(),
  providerList: [{ name: 'GoogleVertex' }, { name: 'Google' }],
  model: 'google/gemini-2.5-flash',
  setModel: vi.fn(),
  modelList: [
    {
      name: 'google/gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      provider: 'GoogleVertex',
      maxTokenAllowed: 1000000,
    },
    {
      name: 'gemini-3.7-flash',
      label: 'Gemini 3.7 Flash',
      provider: 'Google',
      maxTokenAllowed: 1000000,
    },
  ],
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
    expect(screen.queryByRole('dialog', { name: 'Chat tools' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More tools' }));

    expect(screen.getByRole('dialog', { name: 'Chat tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload file' })).toBeInTheDocument();
    expect(screen.getByLabelText('Web page URL')).toBeInTheDocument();
    expect(screen.getByText('MCP control')).toBeInTheDocument();
  });

  it('uses a native mobile provider and model list rather than desktop dropdowns', () => {
    const setModelSettingsCollapsed = vi.fn();
    render(<NativeMobileChatBox {...props} setIsModelSettingsCollapsed={setModelSettingsCollapsed} />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose model' }));
    expect(setModelSettingsCollapsed).toHaveBeenCalledWith(false);

    render(<NativeMobileChatBox {...props} isModelSettingsCollapsed={false} />);
    expect(screen.getByRole('dialog', { name: 'Model settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GoogleVertex' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search models')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gemini 2.5 Flash/i })).toBeInTheDocument();
  });

  it('uses a full-size in-flow send button instead of an absolutely positioned desktop button', () => {
    render(<NativeMobileChatBox {...props} input="Hello" />);

    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send).toHaveClass('shrink-0');
    expect(send).not.toHaveClass('absolute');
  });
});
