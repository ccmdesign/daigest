# Codex Nuxt Implementation Assessment

## Context Recap
- The end-to-end goal (see `docs/project-overview.md`, `docs/specs-00.md`) is to accept links from Slack or a web UI, run them through the existing scraping/confidence pipeline, and emit reviewer-friendly JSON/markdown for downstream consumption.
- `docs/specs-02.md` and `docs/nuxt-implementation-plan.md` outline the Nuxt 3 experience: ShadCN Vue UI, real-time progress, export/share tooling, and a serverless-friendly backend that reuses the pipeline.

## What’s In Place Now
- **Nuxt foundation** – `nuxt-ai-digest/` runs with Tailwind 3, VueUse, and ShadCN Vue components under the `app/` directory. ShadCN primitives (card, badge, button, textarea, toast surface) power the UI.
- **Streaming processor** – `/api/process` streams per-URL updates over SSE via `useDigestProcessor`, with a fallback to the batch endpoint when SSE isn’t available.
- **Exports & sharing** – The main page offers JSON/Markdown downloads, clipboard copy, share-link creation, toast feedback, and a local recent-runs panel. Share links hydrate through `/api/digest`.
- **Durable storage** – Digests persist to `data/digests.json` by default, overridable with `NUXT_DIGEST_STORE_PATH`; links survive server restarts.
- **Shared digest view** – `/digest/:id` renders stored runs with the ShadCN card grid for read-only sharing.
- **Tests/builds** – Vitest covers the digest-store persistence (`npm test`), and `npm run build` validates client/server bundles.

## Current Gaps & Risks
1. **UX polish** – Filtering, search, and deeper mobile tweaks remain; per-article clipboard actions still lack toast feedback.
2. **Testing depth** – Only the digest store has automated coverage; no Playwright/component tests exercise the streaming UX, downloads, or error paths.
3. **Pipeline parity** – Optional providers/config (Trafilatura, Diffbot, advanced provenance toggles) are still missing compared with `src/pipeline`.
4. **Operational maturity** – Deployment docs, env-var references, and CI hooks for `npm test`/`npm run build` are absent; JSON storage may not meet production durability/retention needs.
5. **History persistence** – Run history lives only in client state; if the team wants shared history, we need a server-side retention strategy alongside the digest store.

## Recommended Next Steps
### 1. Harden the UX layer
- Extend toast feedback to per-article clipboard actions and consider migrating to ShadCN’s official toast utility.
- Tighten responsive styles for the status list/export controls; add filtering/search or confidence toggles per the roadmap.

### 2. Expand automated coverage
- Author Playwright specs using stubbed endpoints (happy path, share-link creation, SSE failure fallback).
- Add Vitest units for markdown/export helpers (extract them from `index.vue`) and the SSE composable logic.
- Wire `npm test` + `npm run build` into CI.

### 3. Close backend parity gaps
- Port optional providers/feature flags (Trafilatura, Diffbot) or document their deferral so the Nuxt pipeline matches `src/pipeline`.
- Evaluate extracting shared pipeline logic into a reusable workspace package to prevent drift.

### 4. Production readiness
- Decide on a production-grade store (SQLite, Supabase, S3, etc.); the JSON-backed layer is already behind an abstraction, so swapping should be straightforward.
- Document required env vars (`NUXT_DIGEST_STORE_PATH`, provider tokens, etc.) and align deployment guidance with `docs/deploy-vercel.md`.
- Implement retention/cleanup policies for persisted digests (and run history if promoted server-side).

## Testing Notes
- `npm run build` – validates the Nuxt client/server bundle.
- `npm test` – runs Vitest coverage for the digest-store persistence layer (extend with additional suites as above).

---
*Prepared by Codex after reviewing repository state as of this run.*
