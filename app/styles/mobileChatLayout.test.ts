import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./index.scss', import.meta.url), 'utf8');

describe('native mobile chat layout', () => {
  it('makes the StickToBottom inner viewport a bounded vertical scroll region', () => {
    expect(css).toContain("[data-testid='native-mobile-chat-surface'] > div:first-child > div");
    expect(css).toContain('overflow-y: auto !important');
    expect(css).toContain('height: 100% !important');
  });

  it('sizes the mobile app frame from dynamic viewport units rather than browser scroll events', () => {
    expect(css).toContain('height: calc(100dvh - var(--header-height)) !important');
  });

  it('keeps mobile conversation content from widening the viewport', () => {
    expect(css).toContain("[data-testid='native-mobile-chat-surface'] :where(pre, table)");
    expect(css).toContain('overflow-wrap: anywhere');
  });
});
