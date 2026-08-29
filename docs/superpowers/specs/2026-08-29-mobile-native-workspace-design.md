# Mkayvibe Mobile-Native Workspace Design

## Goal
Create a genuinely mobile-first Mkayvibe experience below 1024px without changing the working desktop experience or AI provider integrations.

## Scope
- Mobile Chat shell
- Mobile Files surface
- Mobile Code surface
- Mobile Preview surface
- Mobile Git surface
- Touch-safe GitHub repository and branch selection
- Mobile viewport/safe-area/keyboard behavior

Out of scope:
- Desktop layout changes
- Provider behavior changes (Google Gemini/AI Studio, Google Vertex, Azure OpenAI, Cloudflare Workers AI, Bedrock, OpenAI)
- GitHub server-auth architecture changes beyond preserving the existing PR #6 behavior

## Architecture
Desktop and mobile continue sharing application state and workspace data, but render different layout shells. At widths below 1024px, the UI behaves as a single-surface mobile application with a persistent bottom navigation bar. Only the active workspace surface is visible.

The mobile shell owns viewport sizing (`100dvh`), safe-area padding, fixed/pinned navigation, and message/composer positioning. Desktop keeps the existing split layout.

## Mobile Chat
- Full-height single-column layout.
- Header remains reachable without consuming excessive vertical space.
- Message list is the only primary scroll container.
- Composer is pinned above the mobile workspace nav and safe-area inset.
- The composer is full-width with compact controls appropriate for touch.
- Messages use mobile-width padding rather than desktop `max-w-chat` constraints.
- Long code/text wraps or scrolls horizontally where appropriate; no page-level horizontal overflow.
- The keyboard must not hide the composer; use dynamic viewport height and safe-area-aware bottom spacing.

## Mobile Workspace Navigation
Persistent bottom navigation with five tabs:
- Chat
- Files
- Code
- Preview
- Git

Switching tabs changes the single active surface rather than overlaying desktop panels. Tabs remain usable before a project exists, with appropriate empty states.

## Files
- Full-screen file browser within the available mobile viewport.
- File tree/search controls must be touch-sized.
- Selecting a file transitions to Code and opens that file.

## Code
- Full-screen editor using the remaining viewport.
- Compact top toolbar.
- Diff/terminal remain available through mobile-sized actions rather than permanently sharing horizontal space.
- No desktop minimum-width assumptions.

## Preview
- Full-screen preview surface.
- Compact refresh/open controls.
- Preview iframe/container must fill the available mobile viewport without horizontal overflow.

## Git
- Repository list uses touch-native cards, not nested clickable anchors/buttons.
- Each card exposes an explicit large `Select`/`Clone` action.
- Repository metadata wraps cleanly on narrow widths.
- Branch selector becomes a mobile-friendly sheet/full-height panel below 640px while preserving the desktop modal above that width.
- Existing server-backed GitHub account, repo listing, branch listing, clone/import, fetch, pull, commit, push, branch, and PR flows remain unchanged logically.
- No force push.
- Existing dirty-tree safeguards remain.

## Git Clone Fix
The current repo card nests the Clone button inside an anchor. This interaction is replaced with a non-anchor card containing separate `View on GitHub` and `Select repository` actions. This removes touch/nested-interactive ambiguity and prevents the mobile Clone action from appearing or behaving disabled.

## State Flow
`Git -> select repo -> select branch -> import -> workspace loaded -> Files/Code/Chat/Preview/Git all reference the same WebContainer workspace`.

AI edits continue to modify files in that workspace; Git observes those changes and can commit/push them.

## Responsive Boundary
- `<1024px`: mobile-native single-surface shell.
- `>=1024px`: existing desktop behavior is preserved.
- Extra phone-specific refinements may use `<640px`.

## Success Criteria
1. Mobile Chat resembles a native chat application: full-height messages, composer pinned above bottom nav, no desktop split behavior.
2. No horizontal page overflow on common phone widths.
3. All five tabs are independently usable.
4. Repository selection and branch selection work by touch.
5. Clone/import can be started on mobile.
6. After import, Files, Code, Preview, Chat, and Git remain connected to the same workspace.
7. Desktop GitHub and Vertex behavior remain unaffected.
8. Existing provider files are not modified.
