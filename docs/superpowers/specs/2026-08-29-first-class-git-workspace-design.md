# First-Class Git Workspace Design

## Goal

Replace the inherited Bolt Git-import replay flow with a first-class Mkayvibe workspace lifecycle that is reliable on mobile and understandable to non-Git users.

The user-facing flow is:

**Import → Work → Sync to GitHub**

## Problem

The current `/git` import flow clones a repository into the browser WebContainer, converts the cloned files into a synthetic `<boltArtifact>` containing one `<boltAction type="file">` per file, creates a chat from those actions, then hard-navigates into that chat. On chat load, the message parser executes those file actions again.

This causes three problems:

1. The successful Git clone is thrown away by the hard navigation and the files are recreated by the AI action runner instead of remaining the Git working tree.
2. Imported files can be selected/restored/replayed through the Bolt action lifecycle, which is unrelated to Git and can produce file-selection/action errors.
3. On mobile, the path back to GitHub is exposed as separate Commit and Push operations rather than the simple outcome the user expects: save the work back to GitHub.

## Architecture

### 1. Git import creates metadata, not file actions

`GitUrlImport.client.tsx` will no longer clone the repository or generate file `<boltAction>` markup.

It will:

- parse the selected repository URL and optional branch,
- create a lightweight chat entry,
- persist `{ gitUrl, gitBranch }` in chat metadata,
- navigate to the new chat.

The initial chat message is plain text only and MUST NOT contain `<boltArtifact>` or `<boltAction>` tags.

### 2. A Git chat bootstraps the real repository

A dedicated `GitWorkspaceBootstrap` component wraps the chat when its metadata includes `gitUrl`.

On load it will:

- wait for the WebContainer/Git runtime,
- inspect the current WebContainer Git status,
- reuse the workspace when the expected repository/branch is already loaded,
- otherwise clear the stale WebContainer workspace and clone the metadata repository/branch,
- restore the saved working-file snapshot on top of the cloned repository,
- only then expose Chat/Files/Code/Preview/Git.

The clone provides the real `.git` directory. Snapshot restoration never fabricates `.git` data.

### 3. Git chat snapshots are workspace state, not replay messages

For chats with Git metadata, `useChatHistory` will expose the stored snapshot to the bootstrap layer instead of synthesizing snapshot files into Bolt actions.

Non-Git chats retain their existing restore behavior.

This keeps AI edits and manual file edits in the same WebContainer working tree while Git continues to detect the resulting differences.

### 4. Mobile primary action is Sync to GitHub

The mobile Git view keeps existing advanced Git controls, but the first action card becomes the user-facing workflow:

- repository name,
- current branch,
- sync state,
- changed-file count,
- one prominent **Sync to GitHub** action.

Behavior:

- uncommitted changes: commit all with the provided/default Mkayvibe commit message, then push,
- clean but ahead: push,
- clean and behind: offer Pull latest,
- clean and synced: show Up to date,
- diverged or rejected push: show a safe error and leave advanced controls available.

No force push is introduced.

The bottom mobile navigation label changes from `Git` to `Sync` so the purpose is obvious.

## Safety / Compatibility

- Existing server-managed GitHub authentication and Git proxy behavior remain unchanged.
- Existing non-force push behavior remains unchanged.
- Existing pull fast-forward safety remains unchanged.
- Google Gemini / AI Studio provider code is untouched.
- Google Vertex provider code is untouched.
- Azure OpenAI provider code is untouched.
- Cloudflare provider code is untouched.
- Desktop Chat/Workbench composition is not redesigned in this pass.

## Mobile Acceptance Criteria

1. Select a GitHub repository and branch.
2. Import creates a project without generating or replaying file Bolt actions.
3. The imported repository opens as a real Git working tree.
4. Files are immediately available after repository bootstrap completes.
5. Chat edits operate on those same files.
6. Git status detects AI/manual edits.
7. The Sync tab clearly shows repository, branch, change count and sync state.
8. One primary Sync to GitHub action commits and pushes ordinary changes.
9. Refreshing/reopening a Git chat reclones the real repository and overlays its saved working snapshot instead of replaying file actions.
10. Existing provider and server GitHub integrations remain unchanged.
