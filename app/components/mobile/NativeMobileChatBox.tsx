import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

const NativeMobileChatBoxClient = lazy(() =>
  import('./NativeMobileChatBox.client').then((module) => ({ default: module.NativeMobileChatBox })),
);

export function NativeMobileChatBox(props: Record<string, any>) {
  return (
    <ClientOnly fallback={<div className="h-[84px] w-full rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2" />}>
      {() => (
        <Suspense
          fallback={<div className="h-[84px] w-full rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2" />}
        >
          <NativeMobileChatBoxClient {...props} />
        </Suspense>
      )}
    </ClientOnly>
  );
}
