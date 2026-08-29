# Provider Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add first-class Azure OpenAI, Google Vertex AI, and Cloudflare Workers AI providers while preserving the existing OpenAI, Google Gemini, and Amazon Bedrock integrations.

**Architecture:** Reuse Bolt.diy's existing provider manager and `@ai-sdk/openai` OpenAI-compatible path. Each new provider is registered through `registry.ts`, reads secrets from the existing API-key/env flow, and accepts configurable model/deployment names. Cloudflare and Vertex use their OpenAI-compatible chat-completions endpoints; Vertex obtains a short-lived Google OAuth access token from service-account environment credentials. Azure uses the current Azure OpenAI v1-compatible endpoint and `api-key` authentication.

**Tech Stack:** Remix, Cloudflare Pages/Workers runtime, AI SDK 4.x already in the repository, `@ai-sdk/openai`, `jose`, Vitest.

**Spec:** User-approved Mkayvibe provider requirements from the project conversation: OpenAI, Gemini API, Vertex AI/GCP, Azure OpenAI, Amazon Bedrock, and Cloudflare Workers AI.

## Global Constraints

- Do not remove or change existing provider behavior unnecessarily.
- Do not commit any API keys, tokens, service-account secrets, account IDs, or private keys.
- Keep provider credentials configurable through environment variables and the existing provider API-key UI.
- Keep the current AI SDK major version; do not perform a broad SDK migration.
- Maintain Cloudflare Pages/Workers compatibility.

---

### Task 1: Generic configured-model support

**Files:** `app/types/model.ts`, `app/lib/modules/llm/types.ts`, `app/lib/modules/llm/base-provider.ts`, `app/components/@settings/tabs/providers/cloud/CloudProvidersTab.tsx`, `app/lib/stores/settings.ts`.

- [ ] Add a generic `models?: string` provider setting.
- [ ] Add optional `modelsKey` to provider config and include it in provider cache keys.
- [ ] Let URL-configurable cloud providers edit base URL and comma/newline-separated model/deployment IDs.
- [ ] Add tests around configured-model parsing/selection where practical.

### Task 2: Cloudflare Workers AI

**Files:** create `app/lib/modules/llm/providers/cloudflare-workers-ai.ts`; modify `registry.ts`.

- [ ] Support API token from existing provider API-key flow or `CLOUDFLARE_API_TOKEN`.
- [ ] Build the base URL from `CLOUDFLARE_WORKERS_AI_BASE_URL` or `CLOUDFLARE_ACCOUNT_ID`.
- [ ] Use OpenAI-compatible `/ai/v1/chat/completions` behavior via the existing AI SDK.
- [ ] Include current coding-capable static fallbacks and configurable model IDs.

### Task 3: Azure OpenAI

**Files:** create `app/lib/modules/llm/providers/azure-openai.ts`; modify `registry.ts`.

- [ ] Support API key from existing provider API-key flow or `AZURE_OPENAI_API_KEY`.
- [ ] Accept Azure resource endpoint through `AZURE_OPENAI_BASE_URL` / provider base URL.
- [ ] Use Azure's OpenAI-compatible v1 endpoint with `api-key` authentication.
- [ ] Treat configured model IDs as Azure deployment/model identifiers.

### Task 4: Google Vertex AI

**Files:** create `app/lib/modules/llm/providers/google-vertex.ts`; create `app/lib/modules/llm/providers/google-oauth.ts`; modify `registry.ts`.

- [ ] Accept project/location/model configuration from env/settings.
- [ ] Use `GOOGLE_VERTEX_ACCESS_TOKEN` when supplied.
- [ ] Otherwise create/cache a short-lived OAuth token using service-account `GOOGLE_VERTEX_CLIENT_EMAIL` + `GOOGLE_VERTEX_PRIVATE_KEY` with `jose`.
- [ ] Use Vertex's OpenAI-compatible endpoint at `/v1/projects/{project}/locations/{location}/endpoints/openapi`.

### Task 5: Configuration documentation

**Files:** `.env.example`, `.env.production`.

- [ ] Document only variable names/placeholders, never real secrets.
- [ ] Add concise setup comments for Azure, Vertex, and Cloudflare Workers AI.

### Task 6: Verification

- [ ] Verify changed provider files by source review.
- [ ] Open a draft PR from `provider-integrations` into `mobile-first` so CI can run if Actions are enabled.
- [ ] Confirm Cloudflare produces a branch preview before merging.
