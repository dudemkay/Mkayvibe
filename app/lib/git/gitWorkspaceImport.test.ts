import type { Message } from 'ai';
import { describe, expect, it } from 'vitest';
import {
  createGitWorkspaceImportMessage,
  parseGitWorkspaceTarget,
  sanitizeLegacyGitImportMessages,
} from './gitWorkspaceImport';

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

describe('sanitizeLegacyGitImportMessages', () => {
  it('replaces the old imported-files artifact but preserves later AI artifacts', () => {
    const messages: Message[] = [
      {
        id: 'legacy-import',
        role: 'assistant',
        content:
          'Cloning repo\n<boltArtifact id="imported-files" title="Git Cloned Files"><boltAction type="file" filePath="app.ts">old</boltAction></boltArtifact>',
      },
      {
        id: 'later-build',
        role: 'assistant',
        content:
          '<boltArtifact id="feature-work" title="Feature"><boltAction type="file" filePath="app.ts">new</boltAction></boltArtifact>',
      },
    ];

    const sanitized = sanitizeLegacyGitImportMessages(
      messages,
      'https://github.com/dudemkay/Mkayvibe.git',
      'main',
    );

    expect(String(sanitized[0].content)).not.toContain('<boltArtifact');
    expect(String(sanitized[0].content)).toContain('GitHub workspace connected');
    expect(sanitized[0].id).toBe('legacy-import');
    expect(sanitized[1]).toEqual(messages[1]);
  });
});
