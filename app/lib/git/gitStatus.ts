export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'untracked';

export interface GitFileChange {
  path: string;
  status: GitFileStatus;
  staged: boolean;
}

export type GitStatusMatrixRow = [path: string, head: number, workdir: number, stage: number];

/**
 * Translate one isomorphic-git statusMatrix row into the small status model
 * used by the Mkayvibe Git workspace.
 */
export function classifyGitStatusRow([path, head, workdir, stage]: GitStatusMatrixRow): GitFileChange | null {
  // Tracked file is identical in HEAD, workdir, and index.
  if (head === 1 && workdir === 1 && stage === 1) {
    return null;
  }

  // File does not exist anywhere.
  if (head === 0 && workdir === 0 && stage === 0) {
    return null;
  }

  if (head === 0) {
    return {
      path,
      status: stage === 0 ? 'untracked' : 'added',
      staged: stage !== 0,
    };
  }

  if (workdir === 0) {
    return {
      path,
      status: 'deleted',
      staged: stage === 0,
    };
  }

  return {
    path,
    status: 'modified',
    staged: stage !== 1,
  };
}
