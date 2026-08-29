import { describe, expect, it } from 'vitest';
import { classifyGitStatusRow } from './gitStatus';

describe('classifyGitStatusRow', () => {
  it('ignores clean tracked files', () => {
    expect(classifyGitStatusRow(['app.ts', 1, 1, 1])).toBeNull();
  });

  it('marks an unstaged tracked edit as modified', () => {
    expect(classifyGitStatusRow(['app.ts', 1, 2, 1])).toEqual({
      path: 'app.ts',
      status: 'modified',
      staged: false,
    });
  });

  it('marks a staged tracked edit as modified and staged', () => {
    expect(classifyGitStatusRow(['app.ts', 1, 2, 2])).toEqual({
      path: 'app.ts',
      status: 'modified',
      staged: true,
    });
  });

  it('marks a new unstaged file as untracked', () => {
    expect(classifyGitStatusRow(['new.ts', 0, 2, 0])).toEqual({
      path: 'new.ts',
      status: 'untracked',
      staged: false,
    });
  });

  it('marks a new staged file as added', () => {
    expect(classifyGitStatusRow(['new.ts', 0, 2, 2])).toEqual({
      path: 'new.ts',
      status: 'added',
      staged: true,
    });
  });

  it('marks an unstaged deletion as deleted', () => {
    expect(classifyGitStatusRow(['old.ts', 1, 0, 1])).toEqual({
      path: 'old.ts',
      status: 'deleted',
      staged: false,
    });
  });

  it('marks a staged deletion as deleted and staged', () => {
    expect(classifyGitStatusRow(['old.ts', 1, 0, 0])).toEqual({
      path: 'old.ts',
      status: 'deleted',
      staged: true,
    });
  });
});
