import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface NativeMobileScrollerProps {
  children: ReactNode;
}

const BOTTOM_THRESHOLD = 96;

export function NativeMobileScroller({ children }: NativeMobileScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({ top: element.scrollHeight, behavior });
    pinnedToBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  const updatePinnedState = useCallback(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const pinned = distanceFromBottom <= BOTTOM_THRESHOLD;
    pinnedToBottomRef.current = pinned;
    setShowJumpToLatest(!pinned);
  }, []);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const keepPinned = () => {
      if (pinnedToBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom('auto'));
      }
    };

    keepPinned();

    const observer = new ResizeObserver(keepPinned);
    observer.observe(content);

    return () => observer.disconnect();
  }, [scrollToBottom]);

  return (
    <div className="relative h-full min-h-0 min-w-0 overflow-hidden">
      <div
        ref={scrollRef}
        data-testid="native-mobile-message-scroll"
        onScroll={updatePinnedState}
        className="h-full min-h-0 w-full min-w-0 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      >
        <div ref={contentRef} className="min-h-full min-w-0 px-3 py-4">
          {children}
        </div>
      </div>

      {showJumpToLatest && (
        <button
          type="button"
          aria-label="Jump to latest message"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-3 left-1/2 z-10 flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-full border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 text-xs font-medium text-bolt-elements-textPrimary shadow-lg"
        >
          <span className="i-ph:arrow-down text-base" aria-hidden="true" />
          Latest
        </button>
      )}
    </div>
  );
}
