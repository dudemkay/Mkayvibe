import { useEffect, useState, type ReactNode } from 'react';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { db, getMessages, getSnapshot, type ChatHistoryItem } from '~/lib/persistence';
import type { Snapshot } from '~/lib/persistence/types';
import { GitWorkspaceBootstrap } from './GitWorkspaceBootstrap.client';

interface GitChatRouteBootstrapProps {
  routeId: string;
  children: ReactNode;
}

export function GitChatRouteBootstrap({ routeId, children }: GitChatRouteBootstrapProps) {
  const [workspace, setWorkspace] = useState<
    { chat: ChatHistoryItem | null; snapshot?: Snapshot } | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    setWorkspace(undefined);

    if (!db) {
      setWorkspace({ chat: null });
      return;
    }

    getMessages(db, routeId)
      .then(async (storedChat) => {
        const snapshot = storedChat ? await getSnapshot(db, storedChat.id) : undefined;

        if (!cancelled) {
          setWorkspace({ chat: storedChat || null, snapshot });
        }
      })
      .catch((error) => {
        console.error('Failed to inspect chat workspace metadata:', error);
        if (!cancelled) {
          setWorkspace({ chat: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  if (workspace === undefined) {
    return <LoadingOverlay message="Opening workspace…" />;
  }

  if (!workspace.chat?.metadata?.gitUrl) {
    return <>{children}</>;
  }

  return (
    <GitWorkspaceBootstrap
      metadata={workspace.chat.metadata}
      chatId={workspace.chat.id}
      snapshot={workspace.snapshot}
    >
      {children}
    </GitWorkspaceBootstrap>
  );
}
