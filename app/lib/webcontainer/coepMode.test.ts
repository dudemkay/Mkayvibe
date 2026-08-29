import { describe, expect, it } from 'vitest';
import { getWebContainerCoepMode } from './coepMode';

describe('getWebContainerCoepMode', () => {
  it('uses require-corp on iPhone and iPad browsers', () => {
    expect(
      getWebContainerCoepMode(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('require-corp');
    expect(
      getWebContainerCoepMode(
        'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('require-corp');
  });

  it('uses require-corp on desktop Safari', () => {
    expect(
      getWebContainerCoepMode(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      ),
    ).toBe('require-corp');
  });

  it('keeps credentialless on Chromium browsers', () => {
    expect(
      getWebContainerCoepMode(
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe('credentialless');
  });
});
