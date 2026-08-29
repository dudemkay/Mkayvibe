# Mobile-First Workspace Design

**Date:** 2026-08-29
**Repository:** `dudemkay/Mkayvibe`
**Branch:** `mobile-first`
**Status:** Approved in chat for implementation planning

## Goal

Make Mkayvibe genuinely usable as a mobile-first browser coding workspace while preserving the existing Bolt.diy desktop experience.

The first mobile foundation introduces five primary phone views:

1. Chat
2. Files
3. Code
4. Preview
5. Git

This phase changes responsive architecture only. It does not change AI providers, GitHub authentication/sync logic, WebContainer behavior, deployment behavior, or branding.

## Current State

`BaseChat.tsx` currently renders Chat and Workbench inside one flex layout. On desktop this works well, but on narrow screens the same desktop relationship remains.

`Workbench.client.tsx` already detects viewports below 1024px, but its responsive behavior mainly makes the workbench full width. It still exposes desktop-oriented controls and relies on the existing Code/Diff/Preview slider.

`EditorPanel.tsx` currently renders a horizontal split between the Files/Search/Locks side panel and CodeMirror editor, plus a terminal section. That layout is appropriate for desktop but not for a phone.

The existing application state we should preserve includes:

- `chatStore` for chat visibility/state.
- `workbenchStore.currentView` for `code`, `diff`, and `preview` workbench content.
- `workbenchStore.selectedFile` and document state for file/editor behavior.
- Existing WebContainer, terminal, preview, file, and diff mechanisms.

## Design Principles

### Mobile first, not desktop squeezed smaller

Below 1024px, Mkayvibe will show one primary workspace surface at a time. We will not attempt to display chat, file tree, editor, and preview simultaneously on a phone.

### Preserve desktop behavior

At widths of 1024px and above, the current Bolt.diy split layout and existing controls remain functionally unchanged.

### Reuse existing state and components

The five-tab mobile selection is presentation state, not application state. It will live close to `BaseChat` and will drive which existing surface is visible.

Actual editor/preview behavior continues through the existing `workbenchStore` and `chatStore` rather than introducing parallel file, document, or preview state.

### No provider or Git behavior changes in this phase

The Git tab is only a navigation shell in this phase. Real repository pull/fetch/commit/push functionality will be implemented in the later GitHub phase.

## Mobile Navigation

Create a dedicated `MobileWorkspaceNav` component that renders only below 1024px after a workspace/chat has started.

Tabs:

- **Chat** — conversation and composer.
- **Files** — full-screen Files/Search/Locks browser.
- **Code** — full-screen CodeMirror editor with access to Diff and Terminal controls.
- **Preview** — full-screen current app preview.
- **Git** — placeholder/shell for the future Git integration.

The bar is fixed to the bottom of the viewport and must:

- respect `env(safe-area-inset-bottom)` on iPhone/iPad;
- have touch targets at least 44px high;
- display an obvious active state;
- avoid covering the chat composer, editor, preview controls, or terminal;
- avoid horizontal scrolling at common phone widths.

The navigation should use existing icon infrastructure already present in Bolt.diy rather than adding a new icon dependency.

## Mobile View State

Add a UI-only mobile workspace view type:

```ts
type MobileWorkspaceView = 'chat' | 'files' | 'code' | 'preview' | 'git';
```

`BaseChat` owns this selection because it already composes both Chat and Workbench.

The state is passed into `Workbench` with an `onMobileViewChange` callback.

This state must not duplicate editor or file state. For example:

- selecting `preview` also uses the existing preview component and may align `workbenchStore.currentView` with `preview`;
- selecting `code` uses the existing editor/document state;
- selecting `files` uses the existing `FileTree`, Search, and Locks components;
- selecting a file in Files updates `workbenchStore.selectedFile` and then changes the mobile UI selection to Code;
- selecting Chat does not destroy the workbench state.

## Chat View

On mobile when the active tab is Chat:

- only the chat surface is visible;
- messages use the available phone width without horizontal overflow;
- the composer remains sticky/usable above the bottom navigation;
- the existing model selector, provider controls, uploads, web context, speech controls, and send/stop behavior remain unchanged;
- the desktop `showChat` behavior remains unchanged at >=1024px.

When another mobile tab is active, the chat surface is visually hidden without resetting messages, model selection, or composer state.

## Files View

The Files view reuses the left side of the existing `EditorPanel` rather than creating a duplicate file browser.

On mobile it occupies the full work area above the bottom navigation and exposes the existing:

- Files tab;
- Search tab;
- Locks tab;
- FileTree;
- selected/unsaved indicators.

When a user taps a file:

1. `workbenchStore.setSelectedFile(filePath)` runs as today.
2. The mobile workspace view changes to `code`.
3. The selected document appears in the existing CodeMirror editor.

No separate mobile file store is introduced.

## Code View

The Code view reuses the current CodeMirror editor and document state.

On mobile:

- the file browser is not rendered beside the editor;
- the editor occupies the full workspace width;
- breadcrumb/save/reset behavior is retained in a touch-friendly header;
- Diff remains accessible from Code, but does not need its own bottom-navigation tab;
- Terminal remains accessible from Code and uses the existing `workbenchStore.showTerminal` behavior;
- oversized desktop action groups should collapse or become icon/menu controls where necessary.

On desktop, `EditorPanel` keeps its current split layout.

## Preview View

The Preview tab renders the existing `Preview` component full-screen within the workspace area.

It must:

- use the full available width and height above the bottom navigation;
- preserve current preview refresh, ports, inspector, device/viewport, and WebContainer behavior;
- avoid being constrained by the desktop workbench width variables on mobile;
- preserve the existing desktop Preview behavior.

## Git View

Phase 1 provides a Git view shell only.

It should clearly communicate that repository controls will live there, but must not invent fake sync state or perform any Git operation yet.

The future Git phase will replace this shell with:

- connected repository;
- branch selector;
- fetch/pull state;
- changed files;
- diff review;
- commit message;
- commit/push;
- remote-update/conflict detection;
- pull request support.

## Workbench Header on Mobile

The current Workbench header contains the desktop Code/Diff/Preview slider, export, sync, terminal, modified-files dropdown, sidebar button, and close button.

Below 1024px:

- the bottom navigation replaces the Code/Preview switching responsibility;
- desktop-only sidebar controls are hidden;
- Code-specific secondary actions remain available through compact controls;
- Diff can be reached from Code;
- unnecessary wide text buttons are collapsed to icons or an overflow menu where needed;
- no control should force horizontal overflow.

At >=1024px the current header remains unchanged.

## Layout and Safe Areas

Mobile workspace height should be based on the dynamic viewport rather than assuming a desktop viewport.

Use CSS that supports modern mobile browsers, including `100dvh` where appropriate, with existing app/header offsets preserved.

The bottom navigation padding must include:

```css
padding-bottom: env(safe-area-inset-bottom);
```

Content areas must reserve enough bottom space so that the fixed navigation never obscures interactive controls.

Avoid new hard-coded pixel widths for mobile content.

## Components and Files

Expected implementation boundaries:

### Create

`app/components/mobile/MobileWorkspaceNav.tsx`

Responsibility: render the five mobile tabs and emit view changes. No editor, Git, or provider logic belongs here.

`app/components/workbench/MobileGitView.tsx`

Responsibility: render the Git shell for this phase only.

### Modify

`app/components/chat/BaseChat.tsx`

Responsibility: own mobile workspace presentation state, conditionally display Chat vs Workbench on narrow viewports, reserve bottom-navigation space, and render `MobileWorkspaceNav`.

`app/components/workbench/Workbench.client.tsx`

Responsibility: map mobile presentation views to existing editor/preview/diff surfaces, preserve desktop layout, and switch Files -> Code when a file is selected.

`app/components/workbench/EditorPanel.tsx`

Responsibility: preserve desktop split-panel rendering and add a narrow-screen rendering mode that can show either the existing file-browser side or the existing code editor side without duplication.

`app/components/chat/BaseChat.module.scss`

Responsibility: mobile visibility/layout transitions and safe-area spacing only where CSS module behavior is preferable to utility classes.

Additional existing files should only be changed if actual overflow testing proves necessary.

## Data Flow

### Mobile tab selection

```text
MobileWorkspaceNav
       |
       v
BaseChat mobileView
       |
       +--> chat      -> Chat surface
       |
       +--> files     -> Workbench -> EditorPanel(files)
       |
       +--> code      -> Workbench -> EditorPanel(code)
       |
       +--> preview   -> Workbench -> Preview
       |
       +--> git       -> Workbench -> MobileGitView
```

### File selection

```text
FileTree
   |
   v
workbenchStore.setSelectedFile(path)
   |
   v
BaseChat mobileView = 'code'
   |
   v
Existing currentDocument -> CodeMirrorEditor
```

## Error Handling

This phase introduces no network calls and therefore no new network-error model.

Existing workbench errors, preview errors, file-save errors, and terminal errors continue using their existing mechanisms.

The mobile navigation must fail safely if a preview does not yet exist: the Preview tab may still open the existing Preview surface/empty state, rather than creating separate preview availability state.

The Git shell must not claim that GitHub is connected when it is not.

## Accessibility

- Navigation items use semantic `button` elements.
- Active view is conveyed visually and with `aria-current` or an equivalent accessible state.
- Every icon has an accessible label.
- Touch targets are at least 44px high.
- Keyboard navigation remains usable on tablets/desktops with keyboards.
- The design must not rely on color alone to indicate the active tab.

## Testing and Verification

Automated verification after implementation:

```bash
pnpm run typecheck
pnpm run test
pnpm run build
```

Run lint on modified application code if the repository's current lint baseline permits it:

```bash
pnpm run lint
```

Manual responsive checks:

- 390 x 844 phone viewport: all five tabs visible and tappable, no horizontal page overflow.
- 430 x 932 large-phone viewport: composer, file view, editor, preview, and Git shell unobscured by bottom navigation.
- 768 x 1024 tablet portrait: mobile single-surface behavior remains coherent.
- >=1024px desktop: existing Chat/Workbench split and desktop Workbench controls behave as before.

Functional checks:

1. Start a chat/project.
2. Switch Chat -> Files -> Code -> Preview -> Git -> Chat.
3. Select a file from Files and confirm Code opens that file.
4. Edit/save/reset a file in Code.
5. Open/close Terminal from Code.
6. Open Diff from Code and return without losing the selected file.
7. Preview the running project and return to Chat without losing conversation state.
8. Rotate a phone viewport and confirm no persistent horizontal overflow.
9. Confirm desktop layout has not changed at >=1024px.

## Non-Goals for This Phase

- No Azure OpenAI integration.
- No Google Vertex AI integration.
- No Cloudflare Workers AI integration.
- No changes to OpenAI, Gemini, or Bedrock provider behavior.
- No GitHub OAuth/GitHub App implementation.
- No real Git pull/fetch/commit/push functionality.
- No provider-secret migration.
- No branding redesign.
- No settings-page redesign.
- No custom domain/authentication work.

Those are separate phases after the mobile workspace foundation is stable.

## Success Criteria

The phase is complete when a user can comfortably operate an active Mkayvibe project from a phone using five clear full-screen workspace views, select and edit files, access preview, and return to chat without losing state, while the desktop experience remains functionally unchanged.
