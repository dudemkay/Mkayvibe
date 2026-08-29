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
  { view: 'git', label: 'Sync', icon: 'i-ph:arrows-clockwise' },
] satisfies Array<{ view: MobileWorkspaceView; label: string; icon: string }>;

export function MobileWorkspaceNav({ activeView, onChange }: MobileWorkspaceNavProps) {
  return (
    <nav
      aria-label="Mobile workspace"
      data-testid="native-mobile-nav"
      className="relative z-20 shrink-0 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-1 pt-1 lg:hidden"
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
                'flex min-h-11 min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl bg-transparent px-1 py-1.5 text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentAccent'
                  : 'text-bolt-elements-textTertiary active:bg-bolt-elements-background-depth-2 active:text-bolt-elements-textPrimary',
              )}
            >
              <span aria-hidden="true" className={classNames(item.icon, 'text-xl')} />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
