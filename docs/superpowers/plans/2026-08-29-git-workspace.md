# Git Workspace Implementation Plan

1. Add unit tests for translating `isomorphic-git` status-matrix rows into Mkayvibe file-change states.
2. Add a small pure Git-status helper and types.
3. Extend `useGit` with workspace status, fetch, safe fast-forward pull, commit-all, and non-force push operations while reusing the existing WebContainer filesystem and auth lookup.
4. Pass existing chat `metadata.gitUrl` through `Chat.client` -> `BaseChat` -> `Workbench` -> `MobileGitView`.
5. Replace the mobile Git placeholder with repository/branch state, sync controls, changed files, commit message, Commit, and Push actions.
6. Remove authorization values from Git proxy logging.
7. Run CI/typecheck/build through the pull request, fix regressions, and keep the PR isolated from `main`.