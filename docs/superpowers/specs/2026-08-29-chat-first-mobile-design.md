# Mkayvibe Chat-First Mobile Design

## Goal

Make Mkayvibe behave like a modern mobile AI playground from the first page load: Chat is immediately usable, the prompt composer is always visible, GitHub import is available as a secondary chat action, and Files/Code/Preview/Git remain connected workspace tabs.

## Scope

Mobile/tablet viewports below 1024px only. Desktop layout and all provider/GitHub backend integrations remain unchanged.

## Mobile start experience

- Chat is the default and primary surface.
- `chatStarted=false` must not hide or push the composer below the viewport.
- The welcome content lives inside the mobile chat scroll area rather than above it.
- The mobile composer stays visible at the bottom above the persistent workspace tab bar.
- Model settings start collapsed on mobile to avoid a settings-heavy first screen.
- Import actions are shown as compact start actions immediately above the composer, including GitHub import.
- The old desktop intro/import/template composition remains unchanged for desktop.

## Mobile conversation experience

- Messages use the full available mobile width with safe padding.
- Code/preformatted content scrolls horizontally instead of widening the page.
- The composer remains reachable while the software keyboard is open.
- `window.visualViewport.height` is reflected into a CSS variable so iOS/Android keyboard changes resize the chat shell.
- Safe-area insets are respected above the bottom workspace navigation.

## Workspace navigation

Persistent mobile tabs remain Chat / Files / Code / Preview / Git.

- Chat: always usable.
- Git: always usable, including before a project exists.
- Files: empty state before a workspace; real file browser after import/build.
- Code: empty state before a workspace; editor after import/build.
- Preview: empty state before a workspace; full preview after a runnable project exists.

## GitHub import

GitHub may be entered from either the Chat start actions or the Git tab. Both paths use the existing server-managed GitHub authentication and existing repo/branch import flow. No GitHub credential logic changes are part of this feature.

## Safety / compatibility

- Do not modify Google Gemini, Vertex, Azure OpenAI, Cloudflare Workers AI, Bedrock, OpenAI, or provider registry code.
- Do not modify GitHub server auth, proxy, commit/push/pull, or PR backend logic.
- Keep desktop markup/behavior unchanged wherever practical; mobile-specific branching and CSS must be gated below 1024px.
- No new dependency is required.

## Acceptance criteria

1. On a phone, first load shows a usable prompt composer without scrolling.
2. Mobile model settings are collapsed by default.
3. GitHub/import actions are available immediately from Chat.
4. Opening the keyboard does not hide the composer.
5. Git remains usable before a project starts.
6. After project import, Chat, Files, Code, Preview and Git operate on the same workspace.
7. Desktop provider/GitHub workflows remain unchanged.
