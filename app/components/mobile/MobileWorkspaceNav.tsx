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

const emptyStates: Partial<Record<Exclude<MobileWorkspaceView, 'chat' | 'git'>, { icon: string; title: string; description: string }>> = {
  files: {
    icon: 'i-ph:folder-open',
    title: 'Files',
    description: 'Files will appear here after you start building or import a repository from Git.',
  },
  code: {
    icon: 'i-ph:code',
    title: 'Code',
    description: 'The editor will appear here after you start building or import a repository from Git.',
  },
  preview: {
    icon: 'i-ph:monitor',
    title: 'Preview',
    description: 'Your live preview will appear here after a project starts running.',
  },
};

export function MobileWorkspaceNav({ activeView, onChange, workspaceReady = true }: MobileWorkspaceNavProps) {
  const emptyState = activeView === 'chat' || activeView === 'git' ? null : emptyStates[activeView];

  return (
    <>
      {!workspaceReady && emptyState && (
        <section
          aria-label={`${emptyState.title} empty workspace`}
          className="fixed inset-x-0 top-[var(--header-height)] bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[340] flex items-center justify-center overflow-auto bg-bolt-elements-background-depth-1 px-6 lg:hidden"
        >
          <div className="mx-auto flex max-w-xs flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-2xl text-bolt-elements-textSecondary">
              <span aria-hidden="true" className={emptyState.icon} />
            </div>
            <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">{emptyState.title}</h2>
            <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">{emptyState.description}</p>
          </div>
        </section>
      )}

      <nav
        aria-label="Mobile workspace"
        className="fixed inset-x-0 bottom-0 z-[500] border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1/98 px-1 pt-1 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid h-16 grid-cols-5 gap-1">
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
                  'min-h-11 min-w-0 rounded-xl bg-transparent px-1 py-1.5 text-[11px] font-medium transition-colors',
                  'flex flex-col items-center justify-center gap-0.5 touch-manipulation',
                  isActive
                    ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentAccent'
                    : 'text-bolt-elements-textTertiary hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary',
                )}
              >
                <span aria-hidden="true" className={classNames(item.icon, 'text-xl')} />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
