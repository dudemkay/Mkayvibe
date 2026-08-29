// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  smallViewport: true,
}));

vi.mock('~/lib/hooks', () => ({
  default: () => testState.smallViewport,
}));

vi.mock('./EditorPanel', () => ({
  EditorPanel: ({ mobileMode }: { mobileMode?: string }) => <div data-testid={`editor-${mobileMode || 'desktop'}`} />,
}));
vi.mock('./DiffView', () => ({ DiffView: () => <div data-testid="diff-view" /> }));
vi.mock('./Preview', () => ({ Preview: () => <div data-testid="preview-view" /> }));
vi.mock('./MobileGitView', () => ({ MobileGitView: () => <div data-testid="git-view" /> }));
vi.mock('~/components/chat/chatExportAndImport/ExportChatButton', () => ({ ExportChatButton: () => null }));
vi.mock('~/lib/persistence', () => ({ useChatHistory: () => ({ exportChat: vi.fn() }) }));
vi.mock('~/lib/stores/previews', () => ({ usePreviewStore: () => ({ refreshAllPreviews: vi.fn() }) }));
vi.mock('~/lib/stores/streaming', async () => {
  const { atom } = await vi.importActual<typeof import('nanostores')>('nanostores');
  return { streamingState: atom(false) };
});
vi.mock('~/lib/stores/chat', async () => {
  const { atom } = await vi.importActual<typeof import('nanostores')>('nanostores');
  return { chatStore: atom({ showChat: true }) };
});

vi.mock('~/lib/stores/workbench', async () => {
  const { atom } = await vi.importActual<typeof import('nanostores')>('nanostores');

  return {
    workbenchStore: {
      previews: atom([]),
      showWorkbench: atom(true),
      selectedFile: atom<string | undefined>(undefined),
      currentDocument: atom(undefined),
      unsavedFiles: atom(new Set<string>()),
      files: atom({}),
      currentView: atom<'code' | 'diff' | 'preview'>('code'),
      showTerminal: atom(false),
      setDocuments: vi.fn(),
      setCurrentDocumentContent: vi.fn(),
      setCurrentDocumentScrollPosition: vi.fn(),
      setSelectedFile: vi.fn(),
      saveCurrentDocument: vi.fn(() => Promise.resolve()),
      resetCurrentDocument: vi.fn(),
      syncFiles: vi.fn(),
      toggleTerminal: vi.fn(),
    },
  };
});

import { Workbench } from './Workbench.client';

describe('Workbench mobile surfaces', () => {
  beforeEach(() => {
    testState.smallViewport = true;
  });

  it('renders the files surface on mobile', () => {
    render(<Workbench chatStarted mobileView="files" />);
    expect(screen.getByTestId('editor-files')).toBeInTheDocument();
  });

  it('renders the code surface on mobile', () => {
    render(<Workbench chatStarted mobileView="code" />);
    expect(screen.getByTestId('editor-code')).toBeInTheDocument();
  });

  it('renders preview and Git as distinct mobile surfaces', () => {
    const { rerender } = render(<Workbench chatStarted mobileView="preview" />);
    expect(screen.getByTestId('preview-view')).toBeInTheDocument();

    rerender(<Workbench chatStarted mobileView="git" />);
    expect(screen.getByTestId('git-view')).toBeInTheDocument();
  });

  it('keeps the desktop editor composition when not on a small viewport', () => {
    testState.smallViewport = false;
    render(<Workbench chatStarted mobileView="files" />);
    expect(screen.getByTestId('editor-desktop')).toBeInTheDocument();
  });
});
