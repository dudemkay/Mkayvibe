import { describe, expect, it } from 'vitest';
import { normalizeGooglePrivateKey } from './google-oauth';

describe('normalizeGooglePrivateKey', () => {
  it('converts escaped newlines from environment variables into PEM newlines', () => {
    expect(normalizeGooglePrivateKey('-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n')).toBe(
      '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n',
    );
  });
});
