# Chat-First Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mobile Mkayvibe experience start with a visible, keyboard-safe AI chat composer while preserving the existing desktop and integration behavior.

**Architecture:** Keep the existing BaseChat/Workbench architecture but branch the presentation behavior for viewports below 1024px. Move the mobile welcome/start actions into the chat scroll surface, collapse model controls by default on mobile, and drive mobile shell height from `visualViewport`; keep desktop intro and provider/GitHub backend paths unchanged.

**Tech Stack:** React, Remix, SCSS modules, Vitest/Testing Library, existing WebContainer/workbench stores.

**Spec:** `docs/superpowers/specs/2026-08-29-chat-first-mobile-design.md`

## Global Constraints

- Only change `dudemkay/Mkayvibe` on `brand-polish`.
- Mobile/tablet behavior is below 1024px.
- Do not modify provider implementation/registry files.
- Do not modify GitHub server authentication or Git backend routes.
- Keep desktop behavior unchanged.
- No new dependency.

---

### Task 1: Mobile first-load regression coverage

**Files:**
- Modify: `app/components/chat/BaseChat.mobile.test.tsx`

**Interfaces:**
- Consumes: `BaseChat` mobile viewport behavior.
- Produces: regression checks for visible initial mobile composer/start actions.

- [ ] Add a test that renders `BaseChat chatStarted={false}` on a small viewport and asserts the chat box is present and mobile start actions are rendered.
- [ ] Add a test that verifies the mobile path collapses model settings by default.
- [ ] Run the focused test and verify the new assertions fail before implementation when a runner is available.

### Task 2: Chat-first mobile composition

**Files:**
- Modify: `app/components/chat/BaseChat.tsx`
- Modify: `app/components/chat/BaseChat.module.scss`

**Interfaces:**
- Consumes: existing `ChatBox`, `Messages`, `GitCloneButton`, `ImportButtons`, `MobileWorkspaceNav`.
- Produces: visible mobile composer and compact mobile start flow.

- [ ] Keep the desktop intro above the chat surface only for non-mobile viewports.
- [ ] Put the mobile welcome text inside `StickToBottom.Content` for `chatStarted=false`.
- [ ] Make the mobile StickToBottom root flex to the available height regardless of `chatStarted`.
- [ ] Render a mobile-only compact start-action row immediately above `ChatBox` when no chat has started.
- [ ] Hide the old desktop import/template block on mobile.
- [ ] Collapse model settings automatically on the mobile path.
- [ ] Preserve Messages rendering only after chat starts.

### Task 3: Keyboard-safe viewport sizing

**Files:**
- Modify: `app/components/chat/BaseChat.tsx`
- Modify: `app/components/chat/BaseChat.module.scss`

**Interfaces:**
- Produces CSS custom property `--mk-mobile-viewport-height`.

- [ ] On small viewports, subscribe to `window.visualViewport.resize` and `scroll`.
- [ ] Store `visualViewport.height` in `--mk-mobile-viewport-height` on the BaseChat element.
- [ ] Fall back to `100dvh` when Visual Viewport is unavailable.
- [ ] Clean up listeners and the CSS variable when leaving the mobile path.
- [ ] Use the variable to size the chat shell minus the application header.

### Task 4: Verify tab/workspace compatibility

**Files:**
- Review: `app/components/mobile/MobileWorkspaceNav.tsx`
- Review: `app/components/workbench/Workbench.client.tsx`

- [ ] Confirm Chat and Git remain accessible before a project exists.
- [ ] Confirm Files/Code/Preview still use empty states before workspace readiness.
- [ ] Confirm Git pre-project surface remains rendered.
- [ ] Confirm Files -> Code transition remains unchanged.

### Task 5: Static scope verification

**Files:**
- No production changes expected.

- [ ] Compare `brand-polish` to `main`.
- [ ] Confirm no provider implementation/registry files changed for the chat-first follow-up.
- [ ] Confirm no GitHub server-auth/backend routes changed for the chat-first follow-up.
- [ ] Check CI/workflow status and report honestly if no executable verification is available.
