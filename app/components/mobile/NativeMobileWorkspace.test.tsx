// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { atom } from 'nanostores';

vi.mock('@nanostores/react', () => ({ useStore: (store: { get: () => unknown }) => store.get() }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('~/components/workbench/EditorPanel', () => ({ EditorPanel: () => <div data-testid="editor-panel" /> }));
vi.mock('~/components/workbench/DiffView', () => ({ DiffView: () => <div data-testid="diff-view" /> }));
vi.mock('~/components/workbench/Preview', () => ({ Preview: () => <div data-testid="preview" /> }));
vi.mock('~/components/workbench/MobileGitView', () => ({ MobileGitView: () => <div data-testid="mobile-git-workspace" /> }));
vi.mock('./MobileGitRepositoryPicker.client', () => ({
  MobileGitRepositoryPicker: () => <div data-testid="mobile-git-repository-picker">Repository picker</div>,
}));
vi.mock('~/lib/stores/previews', () => ({ usePreviewStore: () => ({ refreshAllPreviews: vi.fn() }) }));
vi.mock('~/lib/stores/workbench', () => ({
  workbenchStore: {
    selectedFile: atom(undefined),
    currentDocument: atom(undefined),
    unsavedFiles: atom(new Set()),
    files: atom({}),
    currentView: atom('code'),
    showTerminal: atom(false),
    setDocuments: vi.fn(),
    setCurrentDocumentContent: vi.fn(),
    setCurrentDocumentScrollPosition: vi.fn(),
    setSelectedFile: vi.fn(),
    saveCurrentDocument: vi.fn(() => Promise.resolve()),
    resetCurrentDocument: vi.fn(),
    toggleTerminal: vi.fn(),
  },
}));

import { NativeMobileWorkspace } from './NativeMobileWorkspace.client';

describe('NativeMobileWorkspace Git bootstrap', () => {
  it('shows the lightweight repository picker before a project exists', () => {
    render(<NativeMobileWorkspace view="git" onViewChange={vi.fn()} chatStarted={false} />);

    expect(screen.getByTestId('mobile-git-repository-picker')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-git-workspace')).not.toBeInTheDocument();
  });

  it('uses the full Git workspace after the project has started', () => {
    render(<NativeMobileWorkspace view="git" onViewChange={vi.fn()} chatStarted />);

    expect(screen.getByTestId('mobile-git-workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-git-repository-picker')).not.toBeInTheDocument();
  });
});
