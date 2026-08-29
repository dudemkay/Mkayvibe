# Mobile-First Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Mkayvibe genuinely usable on phones through five full-screen mobile workspace views—Chat, Files, Code, Preview, and Git—without changing the existing desktop experience.

**Architecture:** Keep `BaseChat` as the mobile presentation-state owner because it already composes chat and workbench. Reuse existing `workbenchStore` document/view state and existing `FileTree`, `CodeMirrorEditor`, `Preview`, Diff, and Terminal components. Add a thin mobile navigation component and a Git placeholder shell; do not introduce duplicate file/editor/preview state.

**Tech Stack:** React 18, TypeScript, Remix/Vite, Nanostores, Framer Motion, Radix UI, react-resizable-panels, CodeMirror, UnoCSS/Tailwind-style utility classes.

**Spec:** `docs/superpowers/specs/2026-08-29-mobile-first-workspace-design.md`

## Global Constraints

- Work only in `dudemkay/Mkayvibe` on branch `mobile-first`.
- Preserve existing desktop behavior at viewport widths `>=1024px`.
- Use five mobile tabs: `chat`, `files`, `code`, `preview`, `git`.
- Do not change AI provider logic, GitHub authentication/sync behavior, WebContainer behavior, deployment logic, or branding in this phase.
- Reuse `chatStore`, `workbenchStore.currentView`, `workbenchStore.selectedFile`, and existing editor/preview/file state.
- Mobile bottom navigation must respect `env(safe-area-inset-bottom)` and provide touch targets at least 44px high.
- No new runtime dependency is required for this phase.

---

### Task 1: Add Mobile Workspace Types and Navigation

**Files:**
- Create: `app/components/mobile/MobileWorkspaceNav.tsx`
- Create: `app/components/mobile/types.ts`
- Test: `app/components/mobile/MobileWorkspaceNav.test.tsx`

**Interfaces:**
- Produces: `export type MobileWorkspaceView = 'chat' | 'files' | 'code' | 'preview' | 'git'`.
- Produces: `MobileWorkspaceNav({ activeView, onChange })`.
- Consumes: existing icon utility classes such as `i-ph:*`; no new icon package.

- [ ] **Step 1: Write the navigation component test**

Create `app/components/mobile/MobileWorkspaceNav.test.tsx` with tests that render all five labels, mark the active item with `aria-current="page"`, and invoke `onChange('preview')` when Preview is clicked.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm vitest --run app/components/mobile/MobileWorkspaceNav.test.tsx
```

Expected: FAIL because `MobileWorkspaceNav` and `MobileWorkspaceView` do not exist.

- [ ] **Step 3: Create the mobile view type**

Create `app/components/mobile/types.ts`:

```ts
export type MobileWorkspaceView = 'chat' | 'files' | 'code' | 'preview' | 'git';
```

- [ ] **Step 4: Implement `MobileWorkspaceNav`**

Create `app/components/mobile/MobileWorkspaceNav.tsx` with a fixed bottom `<nav>` rendered by its parent only on mobile. Use five semantic `<button>` elements. Each button includes icon + label, an obvious active state, `aria-label`, and `aria-current="page"` on the active button. Use `min-h-11` or an equivalent >=44px touch height and safe-area bottom padding.

Expected tab mapping:

```ts
const items = [
  { view: 'chat', label: 'Chat', icon: 'i-ph:chats-circle' },
  { view: 'files', label: 'Files', icon: 'i-ph:folder-simple' },
  { view: 'code', label: 'Code', icon: 'i-ph:code' },
  { view: 'preview', label: 'Preview', icon: 'i-ph:monitor' },
  { view: 'git', label: 'Git', icon: 'i-ph:git-branch' },
] satisfies Array<{ view: MobileWorkspaceView; label: string; icon: string }>;
```

The component must not import `workbenchStore`, `chatStore`, or Git APIs.

- [ ] **Step 5: Re-run the focused test**

Run:

```bash
pnpm vitest --run app/components/mobile/MobileWorkspaceNav.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add app/components/mobile
git commit -m "feat: add mobile workspace navigation"
```

---

### Task 2: Add the Mobile Git Shell

**Files:**
- Create: `app/components/workbench/MobileGitView.tsx`
- Test: `app/components/workbench/MobileGitView.test.tsx`

**Interfaces:**
- Produces: `MobileGitView()` with no props and no Git network behavior.
- Must not import Octokit, isomorphic-git, GitHub tokens, or repository stores.

- [ ] **Step 1: Write a failing shell test**

Test that the component renders a Git heading and explicitly communicates that repository controls are not connected in this phase, without showing fake branch/sync data.

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
pnpm vitest --run app/components/workbench/MobileGitView.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the Git shell**

Create a full-height centered panel using existing Bolt theme tokens. Include a Git icon, `Git` heading, and copy such as `Repository controls will appear here after GitHub is connected.` No buttons should claim to Pull, Push, Sync, or Commit yet.

- [ ] **Step 4: Re-run the focused test**

```bash
pnpm vitest --run app/components/workbench/MobileGitView.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add app/components/workbench/MobileGitView.tsx app/components/workbench/MobileGitView.test.tsx
git commit -m "feat: add mobile git workspace shell"
```

---

### Task 3: Split `EditorPanel` Into Mobile Files and Code Surfaces

**Files:**
- Modify: `app/components/workbench/EditorPanel.tsx`
- Test: `app/components/workbench/EditorPanel.test.tsx`

**Interfaces:**
- Add optional props:

```ts
mobileMode?: 'desktop' | 'files' | 'code';
onMobileFileOpened?: () => void;
```

- `desktop` retains the current component tree and behavior.
- `files` renders the existing Files/Search/Locks tabs full-width without CodeMirror beside them.
- `code` renders the existing breadcrumb + CodeMirror editor full-width; terminal remains available below it through the existing `showTerminal` state.

- [ ] **Step 1: Add focused behavior tests**

Write tests that verify:
- `mobileMode="files"` renders Files/Search/Locks but not the code editor region.
- selecting a file calls the existing `onFileSelect` and then `onMobileFileOpened`.
- `mobileMode="code"` renders the code surface without the file sidebar.
- omitted `mobileMode` keeps desktop composition.

Mock complex editor/terminal children as necessary so the test only verifies layout/interaction boundaries.

- [ ] **Step 2: Run the focused test and verify the new tests fail**

```bash
pnpm vitest --run app/components/workbench/EditorPanel.test.tsx
```

Expected: FAIL because the new props/modes do not exist.

- [ ] **Step 3: Extract local render helpers inside `EditorPanel.tsx`**

Within `EditorPanel`, create focused local JSX helpers/variables for:
- file browser (`Tabs.Root` with Files/Search/Locks);
- code editor surface (breadcrumb/save/reset + `CodeMirrorEditor`);
- terminal region.

Do not move application state to new stores.

- [ ] **Step 4: Implement mobile files rendering**

When `mobileMode === 'files'`, render the existing file-browser content as the full panel. Wrap the existing `onFileSelect` so it invokes both `onFileSelect(value)` and `onMobileFileOpened?.()` only when a real file path is selected.

- [ ] **Step 5: Implement mobile code rendering**

When `mobileMode === 'code'`, render a vertical layout with the code surface taking full width and the existing `TerminalTabs` below it. Preserve `workbenchStore.showTerminal`, save/reset behavior, theme, scroll, and `autoFocusOnDocumentChange={!isMobile()}`.

- [ ] **Step 6: Preserve desktop rendering unchanged**

When `mobileMode` is omitted or `desktop`, retain the existing vertical editor/terminal group and horizontal file/editor split.

- [ ] **Step 7: Re-run focused tests**

```bash
pnpm vitest --run app/components/workbench/EditorPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

```bash
git add app/components/workbench/EditorPanel.tsx app/components/workbench/EditorPanel.test.tsx
git commit -m "feat: add mobile files and code editor modes"
```

---

### Task 4: Make Workbench Render Mobile Surfaces Without Changing Desktop

**Files:**
- Modify: `app/components/workbench/Workbench.client.tsx`
- Test: `app/components/workbench/Workbench.client.test.tsx`

**Interfaces:**
- Extend `WorkspaceProps` with:

```ts
mobileView?: MobileWorkspaceView;
onMobileViewChange?: (view: MobileWorkspaceView) => void;
```

- On `<1024px`, Workbench maps:
  - `files` -> `EditorPanel mobileMode="files"`
  - `code` -> `EditorPanel mobileMode="code"` or Diff when existing `currentView === 'diff'`
  - `preview` -> existing `Preview`
  - `git` -> `MobileGitView`
- `chat` keeps Workbench mounted but visually out of the active surface through BaseChat composition.

- [ ] **Step 1: Write failing mobile Workbench tests**

Mock `useViewport(1024)` to mobile and verify each mobile view renders the expected child. Verify tapping a file through the editor callback calls `onMobileViewChange('code')`. Add a desktop test confirming the existing slider/header path is still rendered when `useViewport(1024)` reports desktop.

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
pnpm vitest --run app/components/workbench/Workbench.client.test.tsx
```

Expected: FAIL because mobile view props/mapping do not exist.

- [ ] **Step 3: Add mobile prop wiring**

Import `MobileWorkspaceView`, `MobileGitView`, and pass mobile-specific props only through Workbench presentation logic.

- [ ] **Step 4: Add mobile header behavior**

For mobile:
- hide the sidebar-toggle button;
- hide the desktop Code/Diff/Preview slider;
- avoid the wide Export/Sync/Terminal action row;
- in Code, provide compact buttons for Diff and Terminal using existing state/actions;
- keep a compact close/back action only if it remains meaningful with bottom navigation.

Do not delete or alter the desktop header markup/functionality.

- [ ] **Step 5: Map mobile surface content**

Render one surface at a time in the workbench content area based on `mobileView`. When mobile view is `code`, set/maintain `workbenchStore.currentView` as `code` unless the user explicitly opens Diff. When mobile view is `preview`, align `currentView` to `preview` so existing preview behavior remains coherent.

- [ ] **Step 6: Handle Files -> Code transition**

Pass `onMobileFileOpened={() => onMobileViewChange?.('code')}` to the mobile Files editor mode.

- [ ] **Step 7: Update mobile geometry**

On mobile, Workbench should occupy the content viewport above the bottom navigation, use full width, and avoid desktop `--workbench-left` / inner-width constraints. Keep existing motion/width behavior for desktop.

- [ ] **Step 8: Re-run focused tests**

```bash
pnpm vitest --run app/components/workbench/Workbench.client.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit Task 4**

```bash
git add app/components/workbench/Workbench.client.tsx app/components/workbench/Workbench.client.test.tsx
git commit -m "feat: add mobile workbench surfaces"
```

---

### Task 5: Make `BaseChat` Own Mobile Presentation State

**Files:**
- Modify: `app/components/chat/BaseChat.tsx`
- Modify: `app/components/chat/BaseChat.module.scss`
- Test: `app/components/chat/BaseChat.mobile.test.tsx`

**Interfaces:**
- `BaseChat` owns:

```ts
const [mobileView, setMobileView] = useState<MobileWorkspaceView>('chat');
```

- `MobileWorkspaceNav` receives `activeView={mobileView}` and `onChange={setMobileView}`.
- Workbench receives `mobileView` and `onMobileViewChange={setMobileView}`.

- [ ] **Step 1: Write failing mobile composition tests**

Mock viewport detection or `window.matchMedia` consistently with existing project conventions. Verify:
- mobile + active `chat` shows chat and hides active workbench surface;
- switching to Files hides chat visually and exposes Workbench Files;
- the five-tab nav appears only after `chatStarted` on mobile;
- desktop does not render the bottom navigation and retains Chat + Workbench composition.

- [ ] **Step 2: Run focused test and verify it fails**

```bash
pnpm vitest --run app/components/chat/BaseChat.mobile.test.tsx
```

Expected: FAIL because mobile composition state/nav do not exist.

- [ ] **Step 3: Add mobile viewport detection and state**

Use the same `<1024px` viewport convention already used by Workbench. Do not introduce a second breakpoint constant with a different value.

- [ ] **Step 4: Render mobile Chat and Workbench as mutually exclusive visual surfaces**

Keep components mounted where practical so chat/editor state is not discarded, but apply responsive visibility/layout classes so only the active primary surface is interactable on mobile.

- [ ] **Step 5: Render `MobileWorkspaceNav`**

Render it only when `chatStarted && isSmallViewport`. Reserve bottom space in active content so the nav never covers the composer or workspace controls.

- [ ] **Step 6: Add safe-area/mobile CSS**

In `BaseChat.module.scss`, add narrowly scoped mobile styles for:
- mobile workspace content bottom inset;
- `padding-bottom: env(safe-area-inset-bottom)` support where needed;
- no horizontal overflow;
- no desktop transform/opacity behavior accidentally hiding the active phone surface.

Prefer `100dvh` for mobile viewport height where the layout needs an explicit dynamic height.

- [ ] **Step 7: Re-run focused tests**

```bash
pnpm vitest --run app/components/chat/BaseChat.mobile.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add app/components/chat/BaseChat.tsx app/components/chat/BaseChat.module.scss app/components/chat/BaseChat.mobile.test.tsx
git commit -m "feat: add mobile-first workspace shell"
```

---

### Task 6: Mobile Overflow and Touch Polish

**Files:**
- Modify only if verified necessary: `app/components/workbench/Preview.tsx`
- Modify only if verified necessary: `app/components/workbench/FileTree.tsx`
- Modify only if verified necessary: `app/components/chat/ChatBox.tsx`
- Modify only if verified necessary: relevant local CSS/module files

**Interfaces:**
- No new public interfaces unless testing proves a small prop is necessary.

- [ ] **Step 1: Run responsive manual checks against a Cloudflare preview build**

Check:
- `390x844`
- `430x932`
- `768x1024`
- `>=1024px`

Verify no page-level horizontal scrollbar and no bottom-nav overlap.

- [ ] **Step 2: Fix only observed overflow defects**

Examples of acceptable fixes:
- replace rigid `min-w-*` with mobile `min-w-0` / `w-full`;
- make wide action rows horizontally scrollable or collapse them;
- constrain preview/toolbars to viewport width;
- add `overflow-x-hidden` only at the correct container, not globally if it would hide legitimate editor scrolling.

- [ ] **Step 3: Re-test every mobile surface after each overflow fix**

Confirm Chat, Files, Code, Preview, Git all remain usable and desktop remains unchanged.

- [ ] **Step 4: Commit Task 6 if any code changed**

```bash
git add app/components
git commit -m "fix: polish mobile workspace overflow"
```

---

### Task 7: Full Verification and PR

**Files:**
- No new source files expected.
- Update plan checkboxes only if project workflow keeps execution status in-repo.

**Interfaces:**
- None.

- [ ] **Step 1: Run typecheck**

```bash
pnpm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run tests**

```bash
pnpm run test
```

Expected: PASS.

- [ ] **Step 3: Run lint**

```bash
pnpm run lint
```

Expected: PASS, or document any pre-existing lint failures separately from this branch.

- [ ] **Step 4: Run production build**

```bash
pnpm run build
```

Expected: successful Remix/Vite Cloudflare Pages build.

- [ ] **Step 5: Compare branch against `main`**

Review changed files and verify no provider, deployment, or Git implementation files changed outside the approved mobile scope.

- [ ] **Step 6: Create a pull request**

Create a PR from `mobile-first` to `main` titled:

```text
feat: mobile-first workspace navigation
```

PR body should summarize the five-tab mobile architecture, list verification performed, and explicitly state that real Git operations/providers are out of scope for this PR.
