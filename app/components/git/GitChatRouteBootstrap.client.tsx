import { useEffect, useState, type ReactNode } from 'react';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { db, getMessages, type ChatHistoryItem } from '~/lib/persistence';
import { GitWorkspaceBootstrap } from './GitWorkspaceBootstrap.client';

interface GitChatRouteBootstrapProps {
  routeId: string;
  children: ReactNode;
}

export function GitChatRouteBootstrap({ routeId, children }: GitChatRouteBootstrapProps) {
  const [chat, setChat] = useState<ChatHistoryItem | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    if (!db) {
      setChat(null);
      return;
    }

    getMessages(db, routeId)
      .then((storedChat) => {
        if (!cancelled) {
          setChat(storedChat || null);
        }
      })
      .catch((error) => {
        console.error('Failed to inspect chat workspace metadata:', error);
        if (!cancelled) {
          setChat(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  if (chat === undefined) {
    return <LoadingOverlay message="Opening workspace…" />;
  }

  if (!chat?.metadata?.gitUrl) {
    return <>{children}</>;
  }

  return (
    <GitWorkspaceBootstrap metadata={chat.metadata} chatId={chat.id}>
      {children}
    </GitWorkspaceBootstrap>
  );
}
