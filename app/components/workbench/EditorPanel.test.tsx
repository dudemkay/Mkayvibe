// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('~/components/editor/codemirror/CodeMirrorEditor', () => ({
  CodeMirrorEditor: () => <div data-testid="code-editor">Code editor</div>,
}));

vi.mock('./FileTree', () => ({
  FileTree: ({ onFileSelect }: { onFileSelect?: (path?: string) => void }) => (
    <button type="button" onClick={() => onFileSelect?.('/tmp/project/app.tsx')}>
      app.tsx
    </button>
  ),
}));

vi.mock('./Search', () => ({ Search: () => <div>Search surface</div> }));
vi.mock('./LockManager', () => ({ LockManager: () => <div>Locks surface</div> }));
vi.mock('./terminal/TerminalTabs', () => ({
  DEFAULT_TERMINAL_SIZE: 30,
  TerminalTabs: () => <div data-testid="terminal">Terminal</div>,
}));
vi.mock('~/lib/stores/theme', async () => {
  const { atom } = await vi.importActual<typeof import('nanostores')>('nanostores');
  return { themeStore: atom('light') };
});
vi.mock('~/lib/stores/workbench', async () => {
  const { atom } = await vi.importActual<typeof import('nanostores')>('nanostores');
  return {
    workbenchStore: {
      showTerminal: atom(false),
      currentView: atom<'code' | 'diff' | 'preview'>('code'),
    },
  };
});

import { EditorPanel } from './EditorPanel';

describe('EditorPanel mobile modes', () => {
  it('shows the file browser without the code editor in files mode', () => {
    render(<EditorPanel mobileMode="files" />);

    expect(screen.getByRole('tab', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Locks' })).toBeInTheDocument();
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument();
  });

  it('notifies the mobile shell after a file is opened', () => {
    const onFileSelect = vi.fn();
    const onMobileFileOpened = vi.fn();
    render(
      <EditorPanel mobileMode="files" onFileSelect={onFileSelect} onMobileFileOpened={onMobileFileOpened} />,
    );

    screen.getByRole('button', { name: 'app.tsx' }).click();
    expect(onFileSelect).toHaveBeenCalledWith('/tmp/project/app.tsx');
    expect(onMobileFileOpened).toHaveBeenCalledTimes(1);
  });

  it('shows the code editor without the file browser in code mode', () => {
    render(<EditorPanel mobileMode="code" />);

    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Files' })).not.toBeInTheDocument();
  });
});
