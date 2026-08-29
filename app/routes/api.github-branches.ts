import { json } from '@remix-run/cloudflare';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import { resolveGitHubToken } from '~/lib/git/githubAuth';
import { withSecurity } from '~/lib/security';

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

interface BranchInfo {
  name: string;
  sha: string;
  protected: boolean;
  isDefault: boolean;
}

async function githubBranchesLoader({ request, context }: { request: Request; context: any }) {
  try {
    let owner: string;
    let repo: string;
    let bodyToken = '';

    if (request.method === 'POST') {
      const body: any = await request.json();
      owner = body.owner;
      repo = body.repo;
      bodyToken = body.token || '';
    } else {
      const url = new URL(request.url);
      owner = url.searchParams.get('owner') || '';
      repo = url.searchParams.get('repo') || '';
    }

    if (!owner || !repo) {
      return json({ error: 'Owner and repo parameters are required' }, { status: 400 });
    }

    const cookieHeader = request.headers.get('Cookie');
    const apiKeys = getApiKeysFromCookie(cookieHeader);
    const githubToken = resolveGitHubToken({
      bodyToken,
      apiKeys,
      cloudflareEnv: context?.cloudflare?.env || {},
      processEnv: process.env,
    });

    if (!githubToken) {
      return json({ error: 'GitHub token not found' }, { status: 401 });
    }

    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${githubToken}`,
        'User-Agent': 'bolt.diy-app',
      },
    });

    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        return json({ error: 'Repository not found' }, { status: 404 });
      }

      if (repoResponse.status === 401) {
        return json({ error: 'Invalid GitHub token' }, { status: 401 });
      }

      throw new Error(`GitHub API error: ${repoResponse.status}`);
    }

    const repoInfo: any = await repoResponse.json();
    const defaultBranch = repoInfo.default_branch;

    const branchesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${githubToken}`,
        'User-Agent': 'bolt.diy-app',
      },
    });

    if (!branchesResponse.ok) {
      throw new Error(`Failed to fetch branches: ${branchesResponse.status}`);
    }

    const branches: GitHubBranch[] = await branchesResponse.json();
    const transformedBranches: BranchInfo[] = branches.map((branch) => ({
      name: branch.name,
      sha: branch.commit.sha,
      protected: branch.protected,
      isDefault: branch.name === defaultBranch,
    }));

    transformedBranches.sort((a, b) => {
      if (a.isDefault) {
        return -1;
      }

      if (b.isDefault) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });

    return json({
      branches: transformedBranches,
      defaultBranch,
      total: transformedBranches.length,
    });
  } catch (error) {
    console.error('Failed to fetch GitHub branches:', error);

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return json(
          {
            error: 'Failed to connect to GitHub. Please check your network connection.',
          },
          { status: 503 },
        );
      }

      return json(
        {
          error: `Failed to fetch branches: ${error.message}`,
        },
        { status: 500 },
      );
    }

    return json(
      {
        error: 'An unexpected error occurred while fetching branches',
      },
      { status: 500 },
    );
  }
}

export const loader = withSecurity(githubBranchesLoader);
export const action = withSecurity(githubBranchesLoader);
