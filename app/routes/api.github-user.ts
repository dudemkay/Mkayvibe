import { json } from '@remix-run/cloudflare';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import { resolveGitHubToken } from '~/lib/git/githubAuth';
import { withSecurity } from '~/lib/security';

function getToken(request: Request, context: any) {
  return resolveGitHubToken({
    apiKeys: getApiKeysFromCookie(request.headers.get('Cookie')),
    cloudflareEnv: context?.cloudflare?.env || {},
    processEnv: process.env,
  });
}

function githubHeaders(token: string) {
  return {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Mkayvibe',
  };
}

async function githubUserLoader({ request, context }: { request: Request; context: any }) {
  try {
    const githubToken = getToken(request, context);

    if (!githubToken) {
      return json({ error: 'GitHub token not found' }, { status: 401 });
    }

    const response = await fetch('https://api.github.com/user', { headers: githubHeaders(githubToken) });

    if (!response.ok) {
      return json({ error: response.status === 401 ? 'Invalid GitHub token' : 'Failed to read GitHub account' }, { status: response.status });
    }

    const userData = (await response.json()) as {
      login: string;
      name: string | null;
      avatar_url: string;
      html_url: string;
      type: string;
    };

    return json({
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
      type: userData.type,
      serverManaged: Boolean(context?.cloudflare?.env?.GITHUB_TOKEN || process.env.GITHUB_TOKEN),
    });
  } catch (error) {
    console.error('Error fetching GitHub user:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Failed to fetch GitHub user information' }, { status: 500 });
  }
}

export const loader = withSecurity(githubUserLoader, {
  rateLimit: true,
  allowedMethods: ['GET'],
});

async function githubUserAction({ request, context }: { request: Request; context: any }) {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    let action = '';
    let repoFullName = '';
    let searchQuery = '';
    let perPage = 30;

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as any;
      action = body.action || '';
      repoFullName = body.repo || '';
      searchQuery = body.query || '';
      perPage = body.per_page || 30;
    } else {
      const formData = await request.formData();
      action = String(formData.get('action') || '');
      repoFullName = String(formData.get('repo') || '');
      searchQuery = String(formData.get('query') || '');
      perPage = parseInt(String(formData.get('per_page') || '30'), 10) || 30;
    }

    if (action === 'get_token') {
      return json({ error: 'GitHub credentials are server-managed and are never returned to the browser.' }, { status: 403 });
    }

    const githubToken = getToken(request, context);

    if (!githubToken) {
      return json({ error: 'GitHub token not found' }, { status: 401 });
    }

    const headers = githubHeaders(githubToken);

    if (action === 'get_repos') {
      const allRepos: any[] = [];
      let page = 1;

      while (true) {
        const response = await fetch(
          `https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
          { headers },
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = (await response.json()) as any[];
        allRepos.push(...repos);

        if (repos.length < 100) {
          break;
        }

        page += 1;
      }

      return json({
        repos: allRepos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          clone_url: repo.clone_url,
          description: repo.description,
          private: repo.private,
          language: repo.language,
          updated_at: repo.updated_at,
          stargazers_count: repo.stargazers_count || 0,
          forks_count: repo.forks_count || 0,
          topics: repo.topics || [],
          fork: repo.fork || false,
          archived: repo.archived || false,
          default_branch: repo.default_branch || 'main',
        })),
      });
    }

    if (action === 'get_branches') {
      if (!repoFullName) {
        return json({ error: 'Repository name is required' }, { status: 400 });
      }

      const response = await fetch(`https://api.github.com/repos/${repoFullName}/branches?per_page=100`, { headers });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const branches = (await response.json()) as any[];
      return json({ branches });
    }

    if (action === 'search_repos') {
      if (!searchQuery) {
        return json({ error: 'Search query is required' }, { status: 400 });
      }

      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&per_page=${Math.min(perPage, 100)}&sort=updated`,
        { headers },
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return json({
        repos: data.items || [],
        total_count: data.total_count || 0,
        incomplete_results: Boolean(data.incomplete_results),
      });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in GitHub user action:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Failed to process GitHub request' }, { status: 500 });
  }
}

export const action = withSecurity(githubUserAction, {
  rateLimit: true,
  allowedMethods: ['POST'],
});
