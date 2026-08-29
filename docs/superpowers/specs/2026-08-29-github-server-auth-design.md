# GitHub Server-Managed Authentication Design

## Goal

Keep Mkayvibe's existing WebContainer/isomorphic-git workflow, repository selector, branch selector, commit/push/pull/PR flow, and manual PAT fallback while making Cloudflare `GITHUB_TOKEN` the preferred credential for a private deployment.

## Authentication

- `GITHUB_TOKEN` in Cloudflare is authoritative when configured.
- Legacy `VITE_GITHUB_ACCESS_TOKEN` and manual browser PATs remain fallback paths.
- Server-managed credentials are never returned to browser JavaScript.
- The Git smart-HTTP proxy injects the server credential only for `github.com` requests.
- Non-GitHub proxy traffic never receives the GitHub server secret.

## Connection and repository selection

- Settings auto-detects the Cloudflare-backed GitHub account through `/api/github-user`.
- Server-managed connections are represented client-side without a token value.
- Repository stats/listing and branch selection use server routes when the connection has no client token.
- Fine-grained PAT repository selection remains enforced by GitHub itself: Mkayvibe only sees repositories the token can access.

## Workspace and Chat

- Repository import still clones into the existing WebContainer workspace.
- Chat and editor tools continue operating on that same workspace.
- AI edits therefore appear as Git working-tree changes without any separate GitHub write path from Chat.

## Git writes

- Fetch, pull and push continue through isomorphic-git and `/api/git-proxy`.
- The proxy supplies the Cloudflare credential for GitHub network operations.
- Force push remains disabled.
- Dirty-tree protection remains in place for pull and branch switching.
- Pull request creation resolves the same server-first credential on the server.

## Compatibility

- If no Cloudflare GitHub secret exists, the existing manual PAT/cookie path continues to work.
- Google Gemini, Google Vertex, Azure OpenAI and other provider integrations are outside this change and remain untouched.

## Verification

- Unit coverage defines server-first token resolution and GitHub-only proxy credential injection.
- Runtime verification should cover: automatic account detection, repository listing, branch selection, private clone, AI file edit visibility in Git status, commit, non-force push and PR creation.
