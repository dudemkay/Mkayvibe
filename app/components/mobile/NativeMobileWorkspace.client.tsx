import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { FileHistory } from '~/types/actions';
import type { ElementInfo } from '~/components/workbench/Inspector';
import type { MobileWorkspaceView } from './types';
import { workbenchStore } from '~/lib/stores/workbench';
import { usePreviewStore } from '~/lib/stores/previews';
import { EditorPanel } from '~/components/workbench/EditorPanel';
import { DiffView } from '~/components/workbench/DiffView';
import { Preview } from '~/components/workbench/Preview';
import { MobileGitView } from '~/components/workbench/MobileGitView';
import type {
  OnChangeCallback as OnEditorChange,
  OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';

interface NativeMobileWorkspaceProps {
  view: Exclude<MobileWorkspaceView, 'chat'>;
  onViewChange: (view: MobileWorkspaceView) => void;
  chatStarted?: boolean;
  isStreaming?: boolean;
  setSelectedElement?: (element: ElementInfo | null) => void;
}

const titles: Record<Exclude<MobileWorkspaceView, 'chat'>, string> = {
  files: 'Files',
  code: 'Code',
  preview: 'Preview',
  git: 'GitHub',
};

export function NativeMobileWorkspace({
  view,
  onViewChange,
  chatStarted = false,
  isStreaming,
  setSelectedElement,
}: NativeMobileWorkspaceProps) {
  const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);
  const selectedView = useStore(workbenchStore.currentView);

  useEffect(() => {
    workbenchStore.setDocuments(files);
  }, [files]);

  const onEditorChange = useCallback<OnEditorChange>((update) => {
    workbenchStore.setCurrentDocumentContent(update.content);
  }, []);

  const onEditorScroll = useCallback<OnEditorScroll>((position) => {
    workbenchStore.setCurrentDocumentScrollPosition(position);
  }, []);

  const onFileSelect = useCallback((filePath: string | undefined) => {
    workbenchStore.setSelectedFile(filePath);
  }, []);

  const onFileSave = useCallback(() => {
    workbenchStore
      .saveCurrentDocument()
      .then(() => {
        const previewStore = usePreviewStore();
        previewStore.refreshAllPreviews();
      })
      .catch(() => toast.error('Failed to update file content'));
  }, []);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  const openFileInCode = useCallback(() => {
    workbenchStore.currentView.set('code');
    onViewChange('code');
  }, [onViewChange]);

  const editor = (mode: 'files' | 'code') => (
    <EditorPanel
      mobileMode={mode}
      onMobileFileOpened={mode === 'files' ? openFileInCode : undefined}
      editorDocument={currentDocument}
      isStreaming={isStreaming}
      selectedFile={selectedFile}
      files={files}
      unsavedFiles={unsavedFiles}
      fileHistory={fileHistory}
      onFileSelect={onFileSelect}
      onEditorScroll={onEditorScroll}
      onEditorChange={onEditorChange}
      onFileSave={onFileSave}
      onFileReset={onFileReset}
    />
  );

  const renderSurface = () => {
    if (view === 'git') {
      return <MobileGitView />;
    }

    if (!chatStarted) {
      const emptyCopy = {
        files: ['i-ph:folder-open', 'No project files yet', 'Start a build in Chat or import a repository from Git.'],
        code: ['i-ph:code', 'No code open yet', 'Start a build in Chat or import a repository from Git.'],
        preview: ['i-ph:monitor', 'Nothing to preview yet', 'Your live app preview will appear here once a project is running.'],
      } as const;
      const [icon, title, description] = emptyCopy[view];

      return (
        <div className="flex h-full min-h-0 items-center justify-center overflow-auto px-6 py-10">
          <div className="flex max-w-xs flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-2xl text-bolt-elements-textSecondary">
              <span className={icon} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">{description}</p>
          </div>
        </div>
      );
    }

    if (view === 'files') {
      return editor('files');
    }

    if (view === 'preview') {
      return <Preview setSelectedElement={setSelectedElement} />;
    }

    if (selectedView === 'diff') {
      return <DiffView fileHistory={fileHistory} setFileHistory={setFileHistory} />;
    }

    return editor('code');
  };

  return (
    <section
      data-testid={`native-mobile-workspace-${view}`}
      className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-bolt-elements-background-depth-1"
    >
      <header className="flex min-h-12 shrink-0 items-center gap-2 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3">
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-bolt-elements-textPrimary">{titles[view]}</h1>
        {view === 'code' && chatStarted && (
          <>
            <button
              type="button"
              aria-label={selectedView === 'diff' ? 'Return to code' : 'Open diff'}
              onClick={() => workbenchStore.currentView.set(selectedView === 'diff' ? 'code' : 'diff')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent text-bolt-elements-textSecondary active:bg-bolt-elements-background-depth-2"
            >
              <span className={selectedView === 'diff' ? 'i-ph:code' : 'i-ph:git-diff'} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Toggle terminal"
              onClick={() => workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get())}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent text-bolt-elements-textSecondary active:bg-bolt-elements-background-depth-2"
            >
              <span className="i-ph:terminal" aria-hidden="true" />
            </button>
          </>
        )}
      </header>
      <div className="relative min-h-0 min-w-0 overflow-hidden">{renderSurface()}</div>
    </section>
  );
}
