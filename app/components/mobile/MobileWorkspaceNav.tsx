import { classNames } from '~/utils/classNames';
import type { MobileWorkspaceView } from './types';

interface MobileWorkspaceNavProps {
  activeView: MobileWorkspaceView;
  onChange: (view: MobileWorkspaceView) => void;
}

const items = [
  { view: 'chat', label: 'Chat', icon: 'i-ph:chats-circle' },
  { view: 'files', label: 'Files', icon: 'i-ph:folder-simple' },
  { view: 'code', label: 'Code', icon: 'i-ph:code' },
  { view: 'preview', label: 'Preview', icon: 'i-ph:monitor' },
  { view: 'git', label: 'Git', icon: 'i-ph:git-branch' },
] satisfies Array<{ view: MobileWorkspaceView; label: string; icon: string }>;

export function MobileWorkspaceNav({ activeView, onChange }: MobileWorkspaceNavProps) {
  return (
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
                  ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent'
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
  );
}
