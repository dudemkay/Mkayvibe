# Mkayvibe Git Workspace Design

## Goal

Turn the existing mobile Git placeholder into a real Git workspace without replacing Bolt.diy's existing repository browser, branch selector, WebContainer, or GitHub connection flow.

## Architecture

The current `useGit` hook remains the browser/WebContainer Git boundary because it already owns the `isomorphic-git` filesystem adapter and clone flow. It will be extended with typed operations for status, fetch, pull, commit, and push.

The UI consumes those operations through `MobileGitView`. Repository metadata continues to come from the existing chat metadata (`metadata.gitUrl`) so there is no second repository store.

Authentication stays behind the existing Git credential lookup for now. This keeps today's PAT/server-token support working while allowing a later GitHub App/OAuth adapter to replace credential acquisition without rebuilding the Git UI.

## First-pass behavior

The Git workspace will:

- Show repository name and current branch.
- Show changed files and simple Added / Modified / Deleted / Untracked states.
- Show local ahead/behind state after fetch when remote tracking data is available.
- Fetch from `origin`.
- Pull only when the working tree is clean and only as a fast-forward operation.
- Commit all current working-tree changes with a user-entered commit message.
- Push the current branch to `origin` without force.
- Refresh status after every operation.
- Surface clear loading, success, authentication, dirty-worktree, and conflict/divergence errors.

Branch creation/switching and opening pull requests are deliberately deferred to pass two.

## Safety

- No API keys, PATs, passwords, or MFA data are added to source control.
- Existing Git proxy functionality is retained, but authorization headers must never be printed to logs.
- Pull will not silently merge over local uncommitted changes.
- Push will never force-update a branch.
- Desktop behavior remains unchanged.

## Testing

Pure Git status-matrix classification is unit-tested first. The mobile Git view is tested for disconnected/non-repository and repository states. CI/typecheck/build on the feature PR are the verification path because the current execution environment cannot resolve GitHub for a local clone.