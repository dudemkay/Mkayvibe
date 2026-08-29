import { json } from '@remix-run/cloudflare';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import { resolveGitHubToken } from '~/lib/git/githubAuth';
import { withSecurity } from '~/lib/security';

interface PullRequestInput {
  owner?: string;
  repo?: string;
  head?: string;
  base?: string;
  title?: string;
  body?: string;
  token?: string;
}

async function githubPullRequestAction({ request, context }: { request: Request; context: any }) {
  try {
    const input = (await request.json()) as PullRequestInput;
    const owner = input.owner?.trim() || '';
    const repo = input.repo?.trim() || '';
    const head = input.head?.trim() || '';
    const title = input.title?.trim() || '';

    if (!owner || !repo || !head || !title) {
      return json({ error: 'Owner, repo, head branch, and title are required.' }, { status: 400 });
    }

    const apiKeys = getApiKeysFromCookie(request.headers.get('Cookie'));
    const githubToken = resolveGitHubToken({
      bodyToken: input.token,
      apiKeys,
      cloudflareEnv: context?.cloudflare?.env || {},
      processEnv: process.env,
    });

    if (!githubToken) {
      return json({ error: 'GitHub token not found. Reconnect GitHub in Settings and try again.' }, { status: 401 });
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mkayvibe',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    let base = input.base?.trim() || '';

    if (!base) {
      const repositoryResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      const repositoryData: any = await repositoryResponse.json().catch(() => ({}));

      if (!repositoryResponse.ok) {
        return json(
          { error: repositoryData.message || `Could not read GitHub repository (${repositoryResponse.status}).` },
          { status: repositoryResponse.status },
        );
      }

      base = repositoryData.default_branch || 'main';
    }

    if (head === base) {
      return json({ error: 'Choose a head branch that is different from the base branch.' }, { status: 400 });
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        head,
        base,
        body: input.body?.trim() || '',
      }),
    });
    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(
        { error: data.message || `GitHub could not create the pull request (${response.status}).` },
        { status: response.status },
      );
    }

    return json(
      {
        pullRequest: {
          number: data.number,
          htmlUrl: data.html_url,
          title: data.title,
          head: data.head?.ref || head,
          base: data.base?.ref || base,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create GitHub pull request:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Failed to create GitHub pull request.' }, { status: 500 });
  }
}

export const action = withSecurity(githubPullRequestAction);
