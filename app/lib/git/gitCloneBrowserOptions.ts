export const BROWSER_GIT_CLONE_OPTIONS = {
  nonBlocking: true,
  batchSize: 25,
  noTags: true,
} as const;

export interface GitCloneProgressEvent {
  phase: string;
  loaded: number;
  total: number;
}

export function formatGitCloneProgress(event: GitCloneProgressEvent) {
  const hasTotal = Number.isFinite(event.total) && event.total > 0;
  const progress = hasTotal ? Math.round((event.loaded / event.total) * 100) : undefined;

  return {
    phase: event.phase || 'Cloning repository',
    progress,
    progressText: hasTotal ? `${event.loaded} / ${event.total}` : `${event.loaded}`,
  };
}
