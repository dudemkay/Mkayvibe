import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import type { ElementInfo } from '~/components/workbench/Inspector';
import type { MobileWorkspaceView } from './types';

interface NativeMobileWorkspaceProps {
  view: Exclude<MobileWorkspaceView, 'chat'>;
  onViewChange: (view: MobileWorkspaceView) => void;
  chatStarted?: boolean;
  isStreaming?: boolean;
  setSelectedElement?: (element: ElementInfo | null) => void;
}

const NativeMobileWorkspaceClient = lazy(() =>
  import('./NativeMobileWorkspace.client').then((module) => ({ default: module.NativeMobileWorkspace })),
);

export function NativeMobileWorkspace(props: NativeMobileWorkspaceProps) {
  return (
    <ClientOnly fallback={<div className="h-full w-full bg-bolt-elements-background-depth-1" />}>
      {() => (
        <Suspense fallback={<div className="h-full w-full bg-bolt-elements-background-depth-1" />}>
          <NativeMobileWorkspaceClient {...props} />
        </Suspense>
      )}
    </ClientOnly>
  );
}
