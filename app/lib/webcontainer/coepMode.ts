export type WebContainerCoepMode = 'credentialless' | 'require-corp';

/**
 * WebKit does not implement credentialless COEP the same way Chromium does.
 * Use require-corp for Safari and every iOS/iPadOS browser (all use WebKit),
 * while keeping credentialless for Chromium where it provides the best preview compatibility.
 */
export function getWebContainerCoepMode(userAgent: string): WebContainerCoepMode {
  const ua = userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  const isSafari =
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|Opera|FxiOS|Firefox/i.test(ua);

  return isIOS || isSafari ? 'require-corp' : 'credentialless';
}
