import { classNames } from '~/utils/classNames';
import type { MobileWorkspaceView } from './types';

interface MobileWorkspaceNavProps {
  activeView: MobileWorkspaceView;
  onChange: (view: MobileWorkspaceView) => void;
  workspaceReady?: boolean;
}

const items = [
  { view: 'chat', label: 'Chat', icon: 'i-ph:chats-circle' },
  { view: 'files', label: 'Files', icon: 'i-ph:folder-simple' },
  { view: 'code', label: 'Code', icon: 'i-ph:code' },
  { view: 'preview', label: 'Preview', icon: 'i-ph:monitor' },
  { view: 'git', label: 'Git', icon: 'i-ph:git-branch' },
] satisfies Array<{ view: MobileWorkspaceView; label: string; icon: string }>;

const emptyStates: Record<Exclude<MobileWorkspaceView, 'chat'>, { icon: string; title: string; description: string }> = {
  files: {
    icon: 'i-ph:folder-open',
    title: 'Files',
    description: 'Project files will appear here after you start a build or import a project from Chat.',
  },
  code: {
    icon: 'i-ph:code',
    title: 'Code',
    description: 'The code editor will appear here after you start a build or import a project from Chat.',
  },
  preview: {
    icon: 'i-ph:monitor',
    title: 'Preview',
    description: 'Your live app preview will appear here once a project is running.',
  },
  git: {
    icon: 'i-ph:git-branch',
    title: 'Git',
    description: 'Repository controls will appear here when a project is available for Git integration.',
  },
};

export function MobileWorkspaceNav({ activeView, onChange, workspaceReady = true }: MobileWorkspaceNavProps) {
  const emptyState = activeView === 'chat' ? null : emptyStates[activeView];

  return (
    <>
      {!workspaceReady && emptyState && (
        <section
          aria-label={`${emptyState.title} empty workspace`}
          className="fixed inset-x-0 top-[calc(var(--header-height)+0.5rem)] bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-[290] flex items-center justify-center overflow-auto bg-bolt-elements-background-depth-1 px-6 lg:hidden"
        >
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-2xl text-bolt-elements-textSecondary">
              <span aria-hidden="true" className={emptyState.icon} />
            </div>
            <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">{emptyState.title}</h2>
            <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">{emptyState.description}</p>
            <button
              type="button"
              onClick={() => onChange('chat')}
              className="mt-5 min-h-11 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
            >
              Go to Chat
            </button>
          </div>
        </section>
      )}

      <nav
        aria-label="Mobile workspace"
        className="fixed inset-x-0 bottom-0 z-[300] border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1/95 px-1 pt-1 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const isActive = item.view === activeView;

            return (
              <button
                key={item.view}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChange(item.view)}
                className={classNames(
                  'min-h-11 min-w-0 rounded-lg bg-transparent px-1 py-1.5 text-[11px] font-medium transition-colors',
                  'flex flex-col items-center justify-center gap-0.5',
                  isActive
                    ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentAccent'
                    : 'text-bolt-elements-textTertiary hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary',
                )}
              >
                <span aria-hidden="true" className={classNames(item.icon, 'text-xl')} />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
