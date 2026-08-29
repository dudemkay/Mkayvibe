import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { GitChatRouteBootstrap } from '~/components/git/GitChatRouteBootstrap.client';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  return json({ id: args.params.id });
}

export default function ChatRoute() {
  const { id } = useLoaderData<typeof loader>();

  if (!id) {
    return <IndexRoute />;
  }

  return (
    <ClientOnly fallback={<IndexRoute />}>
      {() => (
        <GitChatRouteBootstrap routeId={id}>
          <IndexRoute />
        </GitChatRouteBootstrap>
      )}
    </ClientOnly>
  );
}
