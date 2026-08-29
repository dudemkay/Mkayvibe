import { json } from '@remix-run/cloudflare';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import { resolveGitHubToken } from '~/lib/git/githubAuth';
import { withSecurity } from '~/lib/security';
import type { GitHubUserResponse, GitHubStats } from '~/types/GitHub';

async function githubStatsLoader({ request, context }: { request: Request; context: any }) {
  try {
    const githubToken = resolveGitHubToken({
      apiKeys: getApiKeysFromCookie(request.headers.get('Cookie')),
      cloudflareEnv: context?.cloudflare?.env || {},
      processEnv: process.env,
    });

    if (!githubToken) {
      return json({ error: 'GitHub token not found' }, { status: 401 });
    }

    const headers = {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${githubToken}`,
      'User-Agent': 'Mkayvibe',
    };

    const userResponse = await fetch('https://api.github.com/user', { headers });

    if (!userResponse.ok) {
      return json({ error: userResponse.status === 401 ? 'Invalid GitHub token' : 'Failed to fetch GitHub account' }, { status: userResponse.status });
    }

    const user = (await userResponse.json()) as GitHubUserResponse;
    let allRepos: any[] = [];
    let page = 1;

    while (true) {
      const repoResponse = await fetch(
        `https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
        { headers },
      );

      if (!repoResponse.ok) {
        throw new Error(`GitHub API error: ${repoResponse.status}`);
      }

      const repos = (await repoResponse.json()) as any[];
      allRepos = allRepos.concat(repos);

      if (repos.length < 100) {
        break;
      }

      page += 1;
    }

    const publicRepos = allRepos.filter((repo) => !repo.private).length;
    const privateRepos = allRepos.filter((repo) => repo.private).length;
    const totalStars = allRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const totalForks = allRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

    const stats: GitHubStats = {
      repos: allRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        clone_url: repo.clone_url || '',
        description: repo.description,
        private: repo.private,
        language: repo.language,
        updated_at: repo.updated_at,
        stargazers_count: repo.stargazers_count || 0,
        forks_count: repo.forks_count || 0,
        watchers_count: repo.watchers_count || 0,
        topics: repo.topics || [],
        fork: repo.fork || false,
        archived: repo.archived || false,
        size: repo.size || 0,
        default_branch: repo.default_branch || 'main',
        languages_url: repo.languages_url || '',
      })),
      organizations: [],
      recentActivity: [],
      languages: {},
      totalGists: user.public_gists || 0,
      publicRepos,
      privateRepos,
      stars: totalStars,
      forks: totalForks,
      totalStars,
      totalForks,
      followers: user.followers || 0,
      publicGists: user.public_gists || 0,
      privateGists: 0,
      lastUpdated: new Date().toISOString(),
    };

    return json(stats);
  } catch (error) {
    console.error('Error fetching GitHub stats:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Failed to fetch GitHub statistics' }, { status: 500 });
  }
}

export const loader = withSecurity(githubStatsLoader, {
  rateLimit: true,
  allowedMethods: ['GET'],
});
