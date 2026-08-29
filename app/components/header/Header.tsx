import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { toggleNavigationMenu } from '~/lib/ui/navigationEvents';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex h-[var(--header-height)] shrink-0 items-center border-b px-2 sm:px-4', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="z-logo flex shrink-0 items-center gap-1 text-bolt-elements-textPrimary sm:gap-2">
        <button
          type="button"
          onClick={toggleNavigationMenu}
          aria-label="Open navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-transparent text-bolt-elements-textPrimary transition-colors hover:bg-bolt-elements-background-depth-2"
        >
          <span className="i-ph:sidebar-simple-duotone text-xl" aria-hidden="true" />
        </button>
        <a
          href="/"
          aria-label="Mkayvibe"
          className={classNames(
            'items-center text-xl font-semibold tracking-tight text-bolt-elements-textPrimary sm:text-2xl',
            chat.started ? 'hidden sm:flex' : 'flex',
          )}
        >
          Mkay<span className="text-accent-500">vibe</span>
        </a>
      </div>

      {chat.started && (
        <>
          <span className="min-w-0 flex-1 truncate px-2 text-center text-sm text-bolt-elements-textPrimary sm:px-4 sm:text-base">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="hidden shrink-0 lg:block">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
