# Mkayvibe Mobile-Native Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Mkayvibe behave as a true mobile coding/chat application below 1024px while preserving the existing desktop experience and provider integrations.

**Architecture:** Keep shared application/workspace state but give mobile its own single-surface shell and touch-first interactions. Desktop keeps the existing split layout. Mobile Git uses the same server-backed GitHub flow but replaces fragile nested interactive controls.

**Tech Stack:** React 18, Remix, TypeScript, SCSS modules, Tailwind utility classes, Vitest, Testing Library, WebContainer, isomorphic-git.

**Spec:** `docs/superpowers/specs/2026-08-29-mobile-native-workspace-design.md`

## Global Constraints

- Only modify `dudemkay/Mkayvibe` on `brand-polish`.
- Do not modify Google Gemini/AI Studio, Google Vertex, Azure OpenAI, Cloudflare Workers AI, Bedrock, or OpenAI provider files.
- Preserve desktop behavior at `>=1024px`.
- Preserve server-managed GitHub auth from PR #6.
- Keep non-force push and dirty-tree safety behavior.
- Use `100dvh` and safe-area-aware mobile positioning.

---

### Task 1: Touch-Safe Repository Selection

**Files:**
- Modify: `app/components/@settings/tabs/github/components/GitHubRepositoryCard.tsx`
- Modify: `app/components/@settings/tabs/github/components/GitHubRepositorySelector.tsx`
- Modify: `app/components/ui/BranchSelector.tsx`
- Test: `app/components/@settings/tabs/github/components/GitHubRepositoryCard.test.tsx`
- Test: `app/components/ui/BranchSelector.mobile.test.tsx`

**Interfaces:**
- Consumes: existing `GitHubRepoInfo`, `onClone(repo)` callback, server-backed branch route.
- Produces: explicit touch-safe repository selection and mobile branch panel.

- [ ] Write a failing test proving repository selection is a standalone button, not nested inside an anchor, and calls `onClone` once.
- [ ] Run focused test and confirm expected failure.
- [ ] Replace anchor-wrapped card with semantic card container plus separate `View on GitHub` link and full-width mobile `Select repository` button.
- [ ] Run focused test.
- [ ] Write failing mobile branch selector test for full-screen/sheet classes and touch-sized confirm action.
- [ ] Implement mobile branch layout while preserving desktop modal classes.
- [ ] Run focused tests.

### Task 2: Native Mobile Chat Shell

**Files:**
- Modify: `app/components/chat/BaseChat.tsx`
- Modify: `app/components/chat/BaseChat.module.scss`
- Modify: `app/components/chat/ChatBox.tsx` only if necessary for compact mobile controls
- Test: `app/components/chat/BaseChat.mobile.test.tsx`

**Interfaces:**
- Consumes: existing `mobileView`, `Messages`, `ChatBox`, `StickToBottom`, send/input props.
- Produces: one scrollable message region and pinned composer above mobile nav.

- [ ] Extend the mobile test to assert a dedicated mobile chat shell, message region, and composer region.
- [ ] Run focused test and confirm expected failure.
- [ ] Add mobile-only structural wrappers/data-testid hooks without changing desktop DOM behavior unnecessarily.
- [ ] Replace desktop sticky-within-scroll mobile positioning with fixed/flex mobile shell rules: `height: 100dvh`, overflow-hidden shell, flex-1 message scroll region, composer bottom spacing above nav + safe area.
- [ ] Remove mobile desktop `max-w-chat` squeeze and excessive intro spacing.
- [ ] Ensure long content cannot create page-level horizontal overflow.
- [ ] Run focused test.

### Task 3: Mobile Tab Shell and Empty States

**Files:**
- Modify: `app/components/mobile/MobileWorkspaceNav.tsx`
- Modify: `app/components/workbench/Workbench.client.tsx`
- Test: `app/components/mobile/MobileWorkspaceNav.test.tsx`
- Test: `app/components/workbench/Workbench.client.test.tsx`

**Interfaces:**
- Consumes: `MobileWorkspaceView`, active view state, workspace readiness.
- Produces: single active full-screen surface and persistent bottom navigation.

- [ ] Add tests that only the selected mobile surface is exposed and all tabs remain tappable before workspace creation.
- [ ] Run focused tests and confirm expected failures where applicable.
- [ ] Refine mobile nav height/safe-area constants and empty-state positioning.
- [ ] Ensure Workbench renders Files/Code/Preview/Git as exclusive mobile surfaces rather than overlapping desktop panels.
- [ ] Run focused tests.

### Task 4: Files and Code Mobile Usability

**Files:**
- Modify: `app/components/workbench/EditorPanel.tsx`
- Modify: `app/components/workbench/Workbench.client.tsx`
- Test: `app/components/workbench/EditorPanel.test.tsx`
- Test: `app/components/workbench/Workbench.client.test.tsx`

**Interfaces:**
- Consumes: file selection and editor state.
- Produces: full-screen Files and Code experiences; file selection moves user to Code.

- [ ] Add/extend tests for mobile file selection -> Code transition and full-width editor state.
- [ ] Run focused tests.
- [ ] Remove remaining mobile min-width/desktop split assumptions.
- [ ] Ensure editor toolbar and secondary actions wrap or collapse cleanly on mobile.
- [ ] Run focused tests.

### Task 5: Preview and Git Full-Screen Mobile Surfaces

**Files:**
- Modify: `app/components/workbench/Workbench.client.tsx`
- Modify: `app/components/workbench/MobileGitView.tsx`
- Test: `app/components/workbench/MobileGitView.test.tsx`
- Test: `app/components/workbench/Workbench.client.test.tsx`

**Interfaces:**
- Consumes: preview panel, Git workspace hook, repository selector.
- Produces: viewport-filling Preview and Git surfaces with touch-sized controls.

- [ ] Add tests for mobile Git repository selector visibility and key 44px+ actions.
- [ ] Run focused tests.
- [ ] Make Git cards/actions single-column and touch-first on narrow screens.
- [ ] Ensure Preview fills available mobile height and does not sit behind nav.
- [ ] Run focused tests.

### Task 6: Regression/Scope Verification

**Files:**
- Review only unless a regression is found.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: evidence of isolated diff and runtime test checklist.

- [ ] Compare `main...brand-polish` and confirm provider implementation files are not modified by the mobile redesign.
- [ ] Run available focused Vitest tests if a runnable environment exists.
- [ ] Run `pnpm run build` if a runnable environment exists.
- [ ] Check GitHub Actions for the latest branch SHA.
- [ ] Update PR #6 body with mobile redesign scope and explicit verification status.
- [ ] Provide runtime test sequence: mobile Chat -> Git repo select -> branch -> clone -> Files -> Code -> Chat edit -> Git change -> commit/push.
