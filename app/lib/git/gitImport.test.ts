import { describe, expect, it } from 'vitest';
import { buildGitImportUrl } from './gitImport';

describe('buildGitImportUrl', () => {
  it('encodes a repository URL for the existing Git import route', () => {
    expect(buildGitImportUrl('https://github.com/dudemkay/Mkayvibe.git')).toBe(
      '/git?url=https%3A%2F%2Fgithub.com%2Fdudemkay%2FMkayvibe.git',
    );
  });

  it('preserves the selected branch using Bolt clone hash syntax', () => {
    expect(buildGitImportUrl('https://github.com/dudemkay/Mkayvibe.git', 'feature/mobile git')).toBe(
      '/git?url=https%3A%2F%2Fgithub.com%2Fdudemkay%2FMkayvibe.git%23feature%2Fmobile%20git',
    );
  });
});
