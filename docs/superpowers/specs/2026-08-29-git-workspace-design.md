# Mkayvibe Git Workspace Design

## Goal

Turn the existing mobile Git placeholder into a real Git workspace without replacing Bolt.diy's existing repository browser, branch selector, WebContainer, or GitHub connection flow.

## Architecture

Bolt's current `useGit` hook remains responsible for the existing clone/import flow and is left untouched. A separate `useGitWorkspace` hook operates on the already-cloned `.git` directory for status, fetch, pull, commit, and push. Both use the same singleton WebContainer, so there is no duplicate repository state.

`MobileGitView` reads the real repository, branch, remote, and working-tree state directly from the WebContainer checkout. This avoids maintaining a second Git state store and keeps imported repositories authoritative.

Authentication stays behind the existing saved Git credential mechanism for now. This keeps today's PAT-based connection flow working while allowing a later GitHub App/OAuth adapter to replace credential acquisition without rebuilding the Git UI.

## First-pass behavior

The Git workspace will:

- Show repository name and current branch.
- Show changed files and simple Added / Modified / Deleted / Untracked states.
- Show local ahead/behind state when remote tracking data is available.
- Fetch from `origin`.
- Pull only when the working tree is clean and only as a fast-forward operation.
- Commit all current working-tree changes with a user-entered commit message.
- Push the current branch to `origin` without force.
- Refresh status after every operation.
- Surface clear loading, success, authentication, dirty-worktree, and conflict/divergence errors.

Branch creation/switching and opening pull requests are deliberately deferred to pass two.

## Safety

- No API keys, PATs, passwords, or MFA data are added to source control.
- Existing Git proxy functionality is retained, but authorization header values must never be printed to logs.
- Pull will not silently merge over local uncommitted changes.
- Push will never force-update a branch.
- Desktop behavior remains unchanged.

## Testing

Pure Git status-matrix classification is unit-tested first. The mobile Git view is tested for non-repository and repository states plus commit behavior. CI/typecheck/build on the feature PR are the preferred verification path; if the fork does not run Actions, the PR remains draft until a Cloudflare/browser preview is tested.