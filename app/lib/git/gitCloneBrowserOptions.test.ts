import { describe, expect, it } from 'vitest';
import { BROWSER_GIT_CLONE_OPTIONS, formatGitCloneProgress } from './gitCloneBrowserOptions';

describe('browser Git clone options', () => {
  it('uses a non-blocking batched checkout and skips unnecessary tags', () => {
    expect(BROWSER_GIT_CLONE_OPTIONS).toEqual({
      nonBlocking: true,
      batchSize: 25,
      noTags: true,
    });
  });

  it('turns clone progress into a user-facing phase and percentage', () => {
    expect(formatGitCloneProgress({ phase: 'Receiving objects', loaded: 40, total: 80 })).toEqual({
      phase: 'Receiving objects',
      progress: 50,
      progressText: '40 / 80',
    });
  });

  it('supports progress events without a known total', () => {
    expect(formatGitCloneProgress({ phase: 'Checking out files', loaded: 12, total: 0 })).toEqual({
      phase: 'Checking out files',
      progress: undefined,
      progressText: '12',
    });
  });
});
