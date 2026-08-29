import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { useGitHubConnection } from '~/lib/hooks';

interface ConnectionTestResult {
  status: 'success' | 'error' | 'testing';
  message: string;
  timestamp?: number;
}

interface GitHubConnectionProps {
  connectionTest: ConnectionTestResult | null;
  onTestConnection: () => void;
}

export function GitHubConnection({ connectionTest, onTestConnection }: GitHubConnectionProps) {
  const { isConnected, isLoading, isConnecting, isServerSide, connect, disconnect, error } = useGitHubConnection();
  const [token, setToken] = React.useState('');
  const [tokenType, setTokenType] = React.useState<'classic' | 'fine-grained'>('classic');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      return;
    }

    try {
      await connect(token, tokenType);
      setToken('');
    } catch {
      // Error handling is done in the hook.
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <div className="i-ph:spinner-gap-bold h-4 w-4 animate-spin" />
          <span className="text-bolt-elements-textSecondary">Loading connection...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-w-0 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-6">
        {!isConnected && (
          <div className="mb-4 min-w-0 rounded-lg bg-bolt-elements-background-depth-1 p-3 text-xs text-bolt-elements-textSecondary">
            <p className="mb-2 flex min-w-0 flex-wrap items-center gap-1">
              <span className="i-ph:lightbulb h-3.5 w-3.5 shrink-0 text-bolt-elements-icon-success" />
              <span className="font-medium">Recommended:</span>
              <span>store a fine-grained GitHub token as the Cloudflare secret</span>
              <code className="max-w-full rounded bg-bolt-elements-background-depth-2 px-1 py-0.5">GITHUB_TOKEN</code>
              <span>for automatic server-managed connection.</span>
            </p>
            <p>Manual PAT connection remains available as a fallback when no Cloudflare GitHub secret is configured.</p>
          </div>
        )}

        <form onSubmit={handleConnect} className="min-w-0 space-y-4">
          {!isConnected && (
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-sm text-bolt-elements-textSecondary">Token Type</label>
                <select
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value as 'classic' | 'fine-grained')}
                  disabled={isConnecting}
                  className={classNames(
                    'w-full min-w-0 px-3 py-2 rounded-lg text-sm',
                    'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor',
                    'text-bolt-elements-textPrimary focus:outline-none focus:ring-1 focus:ring-bolt-elements-item-contentAccent',
                  )}
                >
                  <option value="classic">Personal Access Token (Classic)</option>
                  <option value="fine-grained">Fine-grained Token</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm text-bolt-elements-textSecondary">
                  {tokenType === 'classic' ? 'Personal Access Token' : 'Fine-grained Token'}
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isConnecting}
                  placeholder={`Enter your GitHub ${tokenType === 'classic' ? 'personal access token' : 'fine-grained token'}`}
                  className="w-full min-w-0 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 text-sm text-bolt-elements-textPrimary focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColorActive"
                />
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-bolt-elements-textSecondary">
                  <a
                    href={`https://github.com/settings/tokens${tokenType === 'fine-grained' ? '?type=beta' : '/new'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-bolt-elements-borderColorActive hover:underline"
                  >
                    Get your token
                    <div className="i-ph:arrow-square-out h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!isConnected ? (
            <button
              type="submit"
              disabled={isConnecting || !token.trim()}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 py-2 text-sm text-white transition-all hover:bg-[#5E41D0] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isConnecting ? 'Connecting...' : 'Connect manually'}
            </button>
          ) : (
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                {!isServerSide && (
                  <button
                    onClick={disconnect}
                    type="button"
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 sm:w-auto"
                  >
                    <div className="i-ph:plug h-4 w-4" />
                    Disconnect
                  </button>
                )}
                <span className="flex min-w-0 items-center gap-2 text-sm text-bolt-elements-textSecondary">
                  <div className="i-ph:check-circle h-4 w-4 shrink-0 text-green-500" />
                  {isServerSide ? 'Connected securely via Cloudflare GITHUB_TOKEN' : 'Connected to GitHub'}
                </span>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://github.com/dashboard', '_blank', 'noopener,noreferrer')}
                  className="min-h-11 w-full sm:w-auto"
                >
                  <div className="i-ph:layout h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  onClick={onTestConnection}
                  disabled={connectionTest?.status === 'testing'}
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                >
                  {connectionTest?.status === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
