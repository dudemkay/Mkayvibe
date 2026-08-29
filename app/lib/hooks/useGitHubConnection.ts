import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import type { GitHubUserResponse, GitHubConnection } from '~/types/GitHub';
import { useGitHubAPI } from './useGitHubAPI';
import { githubConnection, isConnecting, updateGitHubConnection } from '~/lib/stores/github';

export interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  connection: GitHubConnection | null;
  error: string | null;
  isServerSide: boolean;
}

export interface UseGitHubConnectionReturn extends ConnectionState {
  connect: (token: string, tokenType: 'classic' | 'fine-grained') => Promise<void>;
  disconnect: () => void;
  refreshConnection: () => Promise<void>;
  testConnection: () => Promise<boolean>;
}

const STORAGE_KEY = 'github_connection';

export function useGitHubConnection(): UseGitHubConnectionReturn {
  const connection = useStore(githubConnection);
  const connecting = useStore(isConnecting);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useGitHubAPI();

  const loadServerConnection = useCallback(async (): Promise<boolean> => {
    const response = await fetch('/api/github-user');

    if (!response.ok) {
      return false;
    }

    const userData = (await response.json()) as GitHubUserResponse;
    updateGitHubConnection({
      user: userData,
      token: '',
      tokenType: 'fine-grained',
    });

    return true;
  }, []);

  const refreshClientConnection = useCallback(async (currentConnection: GitHubConnection) => {
    if (!currentConnection.token) {
      return;
    }

    const response = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `${currentConnection.tokenType === 'classic' ? 'token' : 'Bearer'} ${currentConnection.token}`,
        'User-Agent': 'Mkayvibe',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const userData = (await response.json()) as GitHubUserResponse;
    updateGitHubConnection({ ...currentConnection, user: userData });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Cloudflare GITHUB_TOKEN is authoritative when configured.
        const serverConnected = await loadServerConnection();

        if (serverConnected || cancelled) {
          return;
        }

        if (connection?.token && !connection.user) {
          await refreshClientConnection(connection);
        }
      } catch (err) {
        console.error('Error loading GitHub connection:', err);

        if (!cancelled) {
          setError('Failed to load GitHub connection');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (token: string, tokenType: 'classic' | 'fine-grained') => {
    if (!token.trim()) {
      setError('Token is required');
      return;
    }

    isConnecting.set(true);
    setError(null);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `${tokenType === 'classic' ? 'token' : 'Bearer'} ${token}`,
          'User-Agent': 'Mkayvibe',
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const userData = (await response.json()) as GitHubUserResponse;
      const connectionData: GitHubConnection = { user: userData, token, tokenType };

      Cookies.set('githubToken', token);
      Cookies.set('githubUsername', userData.login);
      Cookies.set('git:github.com', JSON.stringify({ username: token, password: 'x-oauth-basic' }));
      updateGitHubConnection(connectionData);
      toast.success(`Connected to GitHub as ${userData.login}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to GitHub';
      setError(message);
      toast.error(`Failed to connect: ${message}`);
      throw err;
    } finally {
      isConnecting.set(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    Cookies.remove('githubToken');
    Cookies.remove('githubUsername');
    Cookies.remove('git:github.com');
    updateGitHubConnection({ user: null, token: '', tokenType: 'classic' });
    setError(null);
    toast.success('Local GitHub connection cleared');
  }, []);

  const refreshConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!connection?.token) {
        const connected = await loadServerConnection();

        if (!connected) {
          throw new Error('No GitHub connection to refresh');
        }

        return;
      }

      await refreshClientConnection(connection);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh GitHub connection';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, loadServerConnection, refreshClientConnection]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!connection?.token) {
        return (await fetch('/api/github-user')).ok;
      }

      const response = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `${connection.tokenType === 'classic' ? 'token' : 'Bearer'} ${connection.token}`,
          'User-Agent': 'Mkayvibe',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }, [connection]);

  return {
    isConnected: Boolean(connection?.user),
    isLoading,
    isConnecting: connecting,
    connection,
    error,
    isServerSide: Boolean(connection?.user && !connection?.token),
    connect,
    disconnect,
    refreshConnection,
    testConnection,
  };
}
