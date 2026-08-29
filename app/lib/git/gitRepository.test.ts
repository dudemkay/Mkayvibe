import { describe, expect, it } from 'vitest';
import { parseGitHubRepository } from './gitRepository';

describe('parseGitHubRepository', () => {
  it('parses an HTTPS GitHub remote', () => {
    expect(parseGitHubRepository('https://github.com/dudemkay/Mkayvibe.git')).toEqual({
      owner: 'dudemkay',
      repo: 'Mkayvibe',
    });
  });

  it('parses an SSH GitHub remote', () => {
    expect(parseGitHubRepository('git@github.com:dudemkay/Mkayvibe.git')).toEqual({
      owner: 'dudemkay',
      repo: 'Mkayvibe',
    });
  });

  it('rejects non-GitHub remotes', () => {
    expect(parseGitHubRepository('https://gitlab.com/dudemkay/Mkayvibe.git')).toBeNull();
  });
});
