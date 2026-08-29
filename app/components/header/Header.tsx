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
      className={classNames('flex items-center px-3 sm:px-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        <button
          type="button"
          onClick={toggleNavigationMenu}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent text-bolt-elements-textPrimary transition-colors hover:bg-bolt-elements-background-depth-2"
        >
          <span className="i-ph:sidebar-simple-duotone text-xl" aria-hidden="true" />
        </button>
        <a href="/" className="flex items-center text-xl sm:text-2xl font-semibold tracking-tight text-bolt-elements-textPrimary">
          Mkay<span className="text-accent-500">vibe</span>
        </a>
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-2 sm:px-4 truncate text-center text-sm sm:text-base text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div>
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
