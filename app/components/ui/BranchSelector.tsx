import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { classNames } from '~/utils/classNames';
import { GitBranch, Check, Shield, Star, RefreshCw, X } from 'lucide-react';

interface BranchInfo {
  name: string;
  sha: string;
  protected: boolean;
  isDefault: boolean;
  canPush?: boolean;
}

interface BranchSelectorProps {
  provider: 'github' | 'gitlab';
  repoOwner: string;
  repoName: string;
  projectId?: string | number;
  token: string;
  gitlabUrl?: string;
  defaultBranch?: string;
  onBranchSelect: (branch: string) => void;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

export function BranchSelector({
  provider,
  repoOwner,
  repoName,
  projectId,
  token,
  gitlabUrl,
  defaultBranch,
  onBranchSelect,
  onClose,
  isOpen,
  className,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const filteredBranches = branches.filter((branch) => branch.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const fetchBranches = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response: Response;

      if (provider === 'github') {
        response = await fetch('/api/github-branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: repoOwner, repo: repoName, token }),
        });
      } else {
        if (!projectId) {
          throw new Error('Project ID is required for GitLab repositories');
        }

        response = await fetch('/api/gitlab-branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, gitlabUrl: gitlabUrl || 'https://gitlab.com', projectId }),
        });
      }

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({ error: 'Failed to fetch branches' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: any = await response.json();
      setBranches(data.branches || []);
      setSelectedBranch(data.defaultBranch || defaultBranch || 'main');
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedBranch) {
      return;
    }

    onBranchSelect(selectedBranch);
    onClose();
  };

  useEffect(() => {
    if (isOpen && !branches.length) {
      void fetchBranches();
    }
  }, [isOpen, repoOwner, repoName, projectId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-end bg-black/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className={classNames(
            'flex h-[min(88dvh,720px)] w-full min-w-0 flex-col overflow-hidden border-bolt-elements-borderColor bg-white shadow-2xl dark:bg-gray-950',
            'rounded-t-2xl border-x border-t sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-xl sm:border',
            className,
          )}
        >
          <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-bolt-elements-borderColor px-4 py-3 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <GitBranch className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-bolt-elements-textPrimary sm:text-lg">Select Branch</h3>
                <p className="truncate text-xs text-bolt-elements-textSecondary sm:text-sm">
                  {repoOwner}/{repoName}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close branch selector"
              onClick={onClose}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-bolt-elements-textSecondary transition-colors hover:bg-bolt-elements-background-depth-1 hover:text-bolt-elements-textPrimary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-bolt-elements-borderColorActive border-t-transparent" />
                <p className="text-sm text-bolt-elements-textSecondary">Loading branches...</p>
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8">
                <GitBranch className="h-8 w-8 text-red-500" />
                <p className="text-center text-sm text-red-600">{error}</p>
                <Button onClick={() => void fetchBranches()} variant="outline" size="sm" className="min-h-11">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-bolt-elements-borderColor p-3 sm:p-4">
                  <input
                    type="search"
                    placeholder="Search branches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 text-base text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColorActive sm:text-sm"
                  />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4">
                  {filteredBranches.length > 0 ? (
                    <div className="space-y-1.5">
                      {filteredBranches.map((branch) => (
                        <button
                          type="button"
                          key={branch.name}
                          onClick={() => setSelectedBranch(branch.name)}
                          className={classNames(
                            'min-h-12 w-full rounded-xl border p-3 text-left transition-colors',
                            selectedBranch === branch.name
                              ? 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100'
                              : 'border-transparent bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-2',
                          )}
                        >
                          <div className="flex min-w-0 items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <GitBranch className="h-4 w-4 shrink-0 text-bolt-elements-textSecondary" />
                              <span className="truncate font-medium text-bolt-elements-textPrimary">{branch.name}</span>
                              <div className="flex shrink-0 items-center gap-1">
                                {branch.isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                                {branch.protected && <Shield className="h-3 w-3 text-red-500" />}
                              </div>
                            </div>
                            {selectedBranch === branch.name && <Check className="h-5 w-5 shrink-0 text-blue-600" />}
                          </div>
                          <div className="mt-1 truncate pl-6 text-xs text-bolt-elements-textSecondary">{branch.sha.substring(0, 8)}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-center">
                      <p className="text-sm text-bolt-elements-textSecondary">
                        {searchQuery ? 'No branches found matching your search.' : 'No branches available.'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {!isLoading && !error && branches.length > 0 && (
            <div className="shrink-0 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-3 sm:p-4">
              <div className="mb-2 min-w-0 truncate text-xs text-bolt-elements-textSecondary">
                Selected: <span className="font-medium text-bolt-elements-textPrimary">{selectedBranch}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={onClose} variant="outline" className="min-h-11 w-full">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={!selectedBranch}
                  className="min-h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  Clone Branch
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
