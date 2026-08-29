# Mkayvibe Native Mobile Shell Design

## Goal

Give Mkayvibe a genuinely phone-native browser interface without changing the working desktop workspace or provider/GitHub backends.

## Reference patterns

The final mobile architecture follows patterns used by current mobile AI products and open-source implementations:

- single-pane phone navigation rather than simultaneous chat/editor panes
- conversation and composer as separate layout regions
- composer pinned by layout, not by overlapping `fixed`/`sticky` desktop panels
- model/provider selection as a bottom sheet
- one active workspace surface at a time
- 44–48px touch targets and horizontally scrollable secondary toolbars
- `visualViewport` handling for mobile software keyboards

## Hard separation

At `<1024px`, `BaseChat` takes a dedicated mobile return path.

The mobile path does **not** mount the desktop `ChatBox` or desktop `Workbench`.

It mounts exactly one of:

1. `NativeMobileChatBox` + conversation surface when `mobileView === 'chat'`
2. `NativeMobileWorkspace` when the active view is Files, Code, Preview, or Git

The persistent `MobileWorkspaceNav` is a normal final grid row in the mobile shell. It is navigation only and never renders content overlays.

## Mobile layout

The shell is a two-row CSS grid:

- row 1: `minmax(0, 1fr)` active surface
- row 2: mobile workspace navigation + safe area

The shell height is driven by `--mk-mobile-viewport-height`, synchronized from `window.visualViewport`, minus the existing application header height.

### Chat

Chat is another two-row grid:

- scrollable conversation / empty state
- non-scrolling composer region

No legacy Import Chat, Import Folder, Clone button, starter-template grid, or default prompt grid is rendered in the mobile chat path.

GitHub repository import belongs in the Git tab.

### Composer

`NativeMobileChatBox` keeps the existing Mkayvibe chat actions and provider/model callbacks but uses a phone layout:

- 16px textarea to prevent iOS zoom
- compact horizontal action strip
- attachment, web search, prompt enhance, speech, theme, MCP, discuss/build, model, Supabase controls
- model/provider settings open in a full-width bottom sheet rather than expanding inside the composer

### Workspace

`NativeMobileWorkspace` reuses the existing underlying stores/components without the desktop Workbench container:

- Files: mobile `EditorPanel` file mode
- Code: mobile `EditorPanel` code mode, Diff and Terminal controls in a compact header
- Preview: existing Preview inside the active mobile surface
- Git: existing `MobileGitView`

Selecting a file in Files switches the active shell view to Code.

Before a project exists, Files/Code/Preview render passive local empty states. Git remains usable so a repository can bootstrap the workspace.

## State

The selected mobile view is independent of provider/model state. It is stored in session storage so transient chat/provider re-renders cannot unexpectedly reset the user to Chat.

## Containment

Global mobile CSS is scoped to the native shell:

- no page-level horizontal overflow
- `min-width: 0` containment for flex/grid descendants
- long text wraps
- code and tables scroll horizontally
- media and preview iframes stay within the viewport
- touch targets use touch manipulation

## Isolation requirements

This mobile change must not modify:

- Google Gemini / AI Studio provider implementation
- Google Vertex implementation
- Azure OpenAI implementation
- provider registry/server request logic
- GitHub server auth/proxy/push/pull logic

Desktop continues through the existing `ChatBox` + `Workbench` rendering path.

## Verification

Automated tests assert:

- first mobile render mounts the native shell only
- desktop ChatBox/Workbench/start templates are absent from mobile DOM
- changing tabs unmounts Chat before mounting the selected workspace
- only one workspace surface is mounted at once
- navigation does not generate full-screen overlays

Runtime remains pending a real Cloudflare branch-preview phone test when CI/local execution is unavailable.
