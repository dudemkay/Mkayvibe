# First-Class Git Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make imported GitHub repositories real Mkayvibe workspaces and simplify the mobile return-to-GitHub flow into one primary Sync action.

**Architecture:** Git import persists repository metadata instead of fake Bolt file actions. The chat route bootstraps the real repository into the WebContainer, then overlays the stored workspace snapshot. Mobile Git keeps safe advanced operations but adds a prominent Sync to GitHub workflow.

**Tech Stack:** React, Remix, TypeScript, nanostores, WebContainer API, isomorphic-git, Vitest/Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-29-first-class-git-workspace-design.md`

## Global Constraints

- Work only in `dudemkay/Mkayvibe`.
- Implement on `git-workspace-mobile-fix`; do not merge automatically.
- Do not change AI provider implementations or server-managed GitHub authentication/proxy behavior.
- Never introduce force push.
- Preserve desktop composition.

---

### Task 1: Specify Git import metadata behavior

**Files:**
- Create: `app/lib/git/gitWorkspaceImport.test.ts`
- Create: `app/lib/git/gitWorkspaceImport.ts`

**Interfaces:**
- Produces: `parseGitWorkspaceTarget(target: string): { gitUrl: string; gitBranch?: string }`
- Produces: `createGitWorkspaceImportMessage(gitUrl: string, gitBranch?: string): Message`

- [ ] **Step 1: Write failing tests** asserting branch parsing and that the generated message contains no `<boltArtifact>` or `<boltAction>` tags.
- [ ] **Step 2: Run** `pnpm vitest run app/lib/git/gitWorkspaceImport.test.ts` and confirm the test fails because the module does not exist.
- [ ] **Step 3: Implement** the two pure helpers with plain-text import messaging.
- [ ] **Step 4: Re-run** the focused test and confirm it passes.
- [ ] **Step 5: Commit** `test/feat: define first-class Git import metadata`.

### Task 2: Stop replaying imported repository files

**Files:**
- Modify: `app/components/git/GitUrlImport.client.tsx`

**Interfaces:**
- Consumes: `parseGitWorkspaceTarget`, `createGitWorkspaceImportMessage`.
- Produces: a chat with `{ gitUrl, gitBranch }` metadata and no generated file actions.

- [ ] **Step 1: Add/update a component regression test** proving Git import calls chat import with plain-text messages and repository metadata rather than Bolt actions.
- [ ] **Step 2: Run the focused test** and confirm it fails against the existing clone-and-replay implementation.
- [ ] **Step 3: Replace clone/file-action generation** with metadata-only chat creation.
- [ ] **Step 4: Re-run the focused test** and confirm it passes.
- [ ] **Step 5: Commit** `fix: stop replaying Git imports as Bolt file actions`.

### Task 3: Bootstrap real Git repositories for Git chats

**Files:**
- Create: `app/components/git/GitWorkspaceBootstrap.client.test.tsx`
- Create: `app/components/git/GitWorkspaceBootstrap.client.tsx`
- Modify: `app/lib/hooks/useGit.ts`
- Modify: `app/components/chat/Chat.client.tsx`

**Interfaces:**
- `useGit()` additionally produces `resetWorkspace(): Promise<void>`.
- `GitWorkspaceBootstrap` consumes `metadata?: IChatMetadata`, `snapshot?: Snapshot`, and `children`.

- [ ] **Step 1: Write failing tests** for no-op on non-Git chats, clone on empty Git workspace, reuse matching repository, and restore snapshot only after clone.
- [ ] **Step 2: Run focused tests** and confirm expected failures.
- [ ] **Step 3: Add `resetWorkspace`** to clear stale WebContainer contents before switching Git workspaces.
- [ ] **Step 4: Implement `GitWorkspaceBootstrap`** to inspect/reuse/reset/clone and overlay snapshot files.
- [ ] **Step 5: Wrap `ChatImpl`** with the bootstrap using current chat metadata and workspace snapshot.
- [ ] **Step 6: Re-run focused tests** and confirm they pass.
- [ ] **Step 7: Commit** `feat: bootstrap Git chats as real repositories`.

### Task 4: Keep Git snapshots out of Bolt replay

**Files:**
- Modify: `app/lib/persistence/useChatHistory.ts`
- Add/update persistence-focused tests if an existing harness is available.

**Interfaces:**
- `useChatHistory()` additionally exposes `workspaceSnapshot?: Snapshot`.

- [ ] **Step 1: Write a failing regression test** showing Git metadata chats return their stored messages without synthesizing snapshot `<boltAction>` content and expose the snapshot separately.
- [ ] **Step 2: Run the focused test** and confirm it fails against current replay behavior.
- [ ] **Step 3: Branch restore behavior by chat metadata:** Git chats expose snapshot state for bootstrap; non-Git chats retain current snapshot reconstruction.
- [ ] **Step 4: Re-run the focused test** and confirm it passes.
- [ ] **Step 5: Commit** `fix: restore Git workspace snapshots outside message replay`.

### Task 5: Add mobile Sync to GitHub workflow

**Files:**
- Modify: `app/components/workbench/MobileGitView.test.tsx`
- Modify: `app/components/workbench/MobileGitView.tsx`
- Modify: `app/components/mobile/MobileWorkspaceNav.test.tsx`
- Modify: `app/components/mobile/MobileWorkspaceNav.tsx`

**Interfaces:**
- Existing `commitAll`, `push`, `pull`, and `getStatus` remain unchanged.

- [ ] **Step 1: Extend tests** to require a primary `Sync to GitHub` action and a bottom-nav `Sync` label.
- [ ] **Step 2: Run focused tests** and confirm they fail on the current Commit/Push-first UI.
- [ ] **Step 3: Add the Sync card** with repository/branch/change/sync summary and safe commit-then-push behavior.
- [ ] **Step 4: Rename the mobile nav entry** from Git to Sync without changing the underlying view id.
- [ ] **Step 5: Re-run focused tests** and confirm they pass.
- [ ] **Step 6: Commit** `feat: make GitHub sync the primary mobile workflow`.

### Task 6: Verify branch isolation and regression scope

**Files:**
- No production files unless verification reveals a defect.

- [ ] **Step 1: Run focused tests** for Git import, bootstrap, MobileGitView, MobileWorkspaceNav and Chat mobile shell.
- [ ] **Step 2: Run** `pnpm run build`.
- [ ] **Step 3: Compare** `main...git-workspace-mobile-fix` and confirm provider/server-auth implementation files are not changed.
- [ ] **Step 4: Open a draft pull request** with verification evidence and a phone acceptance checklist.
- [ ] **Step 5: Do not merge** until the Cloudflare branch preview is manually tested on a phone.
