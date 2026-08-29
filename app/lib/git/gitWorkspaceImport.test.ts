import { describe, expect, it } from 'vitest';
import { createGitWorkspaceImportMessage, parseGitWorkspaceTarget } from './gitWorkspaceImport';

describe('parseGitWorkspaceTarget', () => {
  it('separates a selected branch from the repository URL', () => {
    expect(parseGitWorkspaceTarget('https://github.com/dudemkay/Mkayvibe.git#brand-polish')).toEqual({
      gitUrl: 'https://github.com/dudemkay/Mkayvibe.git',
      gitBranch: 'brand-polish',
    });
  });

  it('keeps repository imports without a selected branch', () => {
    expect(parseGitWorkspaceTarget('https://github.com/dudemkay/Mkayvibe.git')).toEqual({
      gitUrl: 'https://github.com/dudemkay/Mkayvibe.git',
      gitBranch: undefined,
    });
  });
});

describe('createGitWorkspaceImportMessage', () => {
  it('creates a plain-text workspace message without Bolt file actions', () => {
    const message = createGitWorkspaceImportMessage('https://github.com/dudemkay/Mkayvibe.git', 'main');
    const content = String(message.content);

    expect(content).toContain('Mkayvibe');
    expect(content).toContain('main');
    expect(content).not.toContain('<boltArtifact');
    expect(content).not.toContain('<boltAction');
  });
});
