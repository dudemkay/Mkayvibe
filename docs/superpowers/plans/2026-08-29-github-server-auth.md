# GitHub Server Auth Implementation Plan

1. Prefer Cloudflare `GITHUB_TOKEN` in shared GitHub token resolution while preserving manual PAT fallback.
2. Inject the server credential only into `github.com` smart-HTTP traffic in the Git proxy.
3. Stop returning GitHub credentials from browser-callable server routes.
4. Auto-detect the server-managed GitHub account in Settings without exposing a token client-side.
5. Make repository/stat listing automatically use server routes when the client connection has no token.
6. Preserve repository/branch import, Git status, fetch, safe pull, commit, non-force push, branch operations and PR creation.
7. Keep all AI provider code outside this change.
8. Verify with focused auth tests and an end-to-end Cloudflare preview test before merging.
