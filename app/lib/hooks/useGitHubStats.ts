import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import type { GitHubStats, GitHubConnection } from '~/types/GitHub';
import { gitHubApiService } from '~/lib/services/githubApiService';

export interface UseGitHubStatsState {
  stats: GitHubStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseGitHubStatsOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
  cacheTimeout?: number;
}

export interface UseGitHubStatsReturn extends UseGitHubStatsState {
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
  clearStats: () => void;
  isStale: boolean;
}

const STATS_CACHE_KEY = 'github_stats_cache';
const DEFAULT_CACHE_TIMEOUT = 30 * 60 * 1000;

export function useGitHubStats(
  connection: GitHubConnection | null,
  options: UseGitHubStatsOptions = {},
  isServerSide: boolean = Boolean(connection && !connection.token),
): UseGitHubStatsReturn {
  const { autoFetch = false, refreshInterval, cacheTimeout = DEFAULT_CACHE_TIMEOUT } = options;
  const serverManaged = isServerSide || Boolean(connection && !connection.token);
  const [state, setState] = useState<UseGitHubStatsState>({
    stats: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastUpdated: null,
  });

  const apiService = useMemo(() => {
    if (!connection?.token) {
      return null;
    }

    gitHubApiService.configure({ token: connection.token, tokenType: connection.tokenType });
    return gitHubApiService;
  }, [connection?.token, connection?.tokenType]);

  const isStale = useMemo(() => {
    if (!state.lastUpdated || !state.stats) {
      return true;
    }

    return Date.now() - state.lastUpdated.getTime() > cacheTimeout;
  }, [state.lastUpdated, state.stats, cacheTimeout]);

  const saveCachedStats = useCallback((stats: GitHubStats, userLogin: string) => {
    try {
      localStorage.setItem(
        STATS_CACHE_KEY,
        JSON.stringify({ stats, timestamp: Date.now(), userLogin }),
      );
    } catch (error) {
      console.warn('Could not cache GitHub stats:', error);
    }
  }, []);

  useEffect(() => {
    if (!connection?.user?.login) {
      return;
    }

    try {
      const cached = localStorage.getItem(STATS_CACHE_KEY);

      if (!cached) {
        return;
      }

      const parsed = JSON.parse(cached);

      if (parsed.userLogin === connection.user.login && parsed.stats) {
        setState((previous) => ({
          ...previous,
          stats: parsed.stats,
          lastUpdated: new Date(parsed.timestamp),
        }));
      }
    } catch {
      localStorage.removeItem(STATS_CACHE_KEY);
    }
  }, [connection?.user?.login]);

  const fetchStats = useCallback(async () => {
    if (!connection?.user) {
      setState((previous) => ({ ...previous, error: 'GitHub connection not available' }));
      return;
    }

    setState((previous) => ({
      ...previous,
      isLoading: !previous.stats,
      isRefreshing: Boolean(previous.stats),
      error: null,
    }));

    try {
      let stats: GitHubStats;

      if (serverManaged) {
        const response = await fetch('/api/github-stats');
        const data = (await response.json().catch(() => ({}))) as GitHubStats & { error?: string };

        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch GitHub repositories (${response.status})`);
        }

        stats = data;
      } else {
        if (!apiService) {
          throw new Error('GitHub API service not available');
        }

        stats = await apiService.generateComprehensiveStats(connection.user);
      }

      const lastUpdated = new Date();
      setState({ stats, isLoading: false, isRefreshing: false, error: null, lastUpdated });
      saveCachedStats(stats, connection.user.login);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch GitHub stats';
      setState((previous) => ({
        ...previous,
        isLoading: false,
        isRefreshing: false,
        error: message,
      }));
      throw error;
    }
  }, [apiService, connection, saveCachedStats, serverManaged]);

  const refreshStats = useCallback(async () => {
    if (state.isLoading || state.isRefreshing) {
      return;
    }

    try {
      await fetchStats();
      toast.success('GitHub repositories updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update GitHub repositories';
      toast.error(message);
      throw error;
    }
  }, [fetchStats, state.isLoading, state.isRefreshing]);

  useEffect(() => {
    if (!autoFetch || !connection?.user || (!isStale && state.stats)) {
      return;
    }

    const timeout = setTimeout(() => {
      void fetchStats().catch((error) => console.warn('GitHub auto-fetch failed:', error));
    }, 100);

    return () => clearTimeout(timeout);
  }, [autoFetch, connection?.user, fetchStats, isStale, state.stats]);

  useEffect(() => {
    if (!refreshInterval || !connection?.user) {
      return;
    }

    const interval = setInterval(() => {
      if (isStale) {
        void fetchStats().catch(() => undefined);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [connection?.user, fetchStats, isStale, refreshInterval]);

  const clearStats = useCallback(() => {
    setState({ stats: null, isLoading: false, isRefreshing: false, error: null, lastUpdated: null });
    localStorage.removeItem(STATS_CACHE_KEY);
  }, []);

  return { ...state, fetchStats, refreshStats, clearStats, isStale };
}

export function useGitHubRepositories(connection: GitHubConnection | null) {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(async () => {
    if (!connection?.user) {
      setError('GitHub connection not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!connection.token) {
        const response = await fetch('/api/github-stats');
        const data = (await response.json().catch(() => ({}))) as { repos?: any[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch repositories');
        }

        setRepositories(data.repos || []);
        return;
      }

      gitHubApiService.configure({ token: connection.token, tokenType: connection.tokenType });
      setRepositories(await gitHubApiService.getAllUserRepositories());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch repositories';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { repositories, isLoading, error, fetchRepositories };
}
