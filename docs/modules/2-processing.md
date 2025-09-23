# Processing Module – Enrichment & Card Management

## Overview
The Processing module transforms queued intake links into digest-ready cards. It owns scraping, summarisation, enrichment signals, and card editing capabilities used by Analysts before handoff to Managers.

## Responsibilities
- Run scraping and summarisation pipelines for each queued URL with resilient fallbacks.
- Persist enriched card data alongside provenance (`original`, `edits`, `editMetadata`).
- Track card status transitions (queued → processing → ready, plus error states) and expose progress indicators.
- Enable Analysts to edit card content, trigger rescans, and review historical changes.

## Key User Interactions
- System workers automatically process new intake entries into digest cards.
- Analysts adjust summaries, titles, or metadata on processed cards and request rescans when content drifts.
- Automated jobs reconcile processing status when Output exports or retriggers require fresh data.

## Editable Card Lifecycle
- **Ingest & Normalise:** Processing workers pull queued links, run the scraper + summariser stack, and store `original` payloads with provenance hashes.
- **Present for Review:** Cards render in the Analyst workspace with summary, tags, confidence scores, and edit affordances. Each card shows status (`ready`, `processing`, `error`) and last-updated metadata.
- **Edit & Stage:** Analysts toggle edit mode to adjust fields. Draft edits live client-side until the Analyst saves or discards; the UI highlights diffed text and required fields.
- **Save & Version:** Save operations create a new history entry capturing previous values, editor identity, optional notes, and diff summary. Cards remain in `ready` unless a rescan or validation failure downgrades them.
- **Handoff:** Once Analysts finalise edits, Processing exposes the canonical card for Output while keeping history accessible for audits and rescans.

### Edit UX & Conflict Handling
- Edit mode locks individual fields, showing inline validation (character limits, markdown sanitisation, forbidden phrases).
- If the underlying card changes while an Analyst is editing (e.g., a rescan updates content), the UI surfaces a merge banner offering `review diff` or `discard local changes` options.
- Undo/redo controls allow Analysts to step through saved history snapshots without leaving the card.
- Save requests include an optimistic concurrency token (history version) so the server can reject stale writes with actionable error messaging.

### Rescan Workflow
- Analysts trigger `Request rescan` per card; Processing queues the job, flips status to `processing`, and displays a spinner plus ETA.
- Background workers rerun scrapers/summarisers, compare new payloads to the latest saved edit, and merge non-conflicting fields automatically. Conflicts (e.g., Analyst-customised summary vs new AI summary) appear as `review required` rows the Analyst must reconcile.
- Failed rescans record structured errors (`timeout`, `paywall`, `parser_error`) and allow Analysts to retry or annotate the card for Output triage.

### Validation & Guardrails
- Mandatory fields: title, summary snippet, key takeaways, source attribution. Empty or low-confidence values block save until the Analyst overrides them.
- Content sanitisation strips script tags, suspicious links, and ensures markdown renders safely.
- Confidence score thresholds flag cards for Analyst attention; scores below the minimum add a badge and optional recommendation to rescan.
- Batch rescans throttle per digest to avoid overloading external providers; queue telemetry tracks wait times.

### Telemetry & Audit Trails
- Emit lifecycle events (`processing_started`, `processing_completed`, `processing_failed`, `edit_submitted`, `edit_reverted`, `rescan_requested`, `rescan_completed`).
- Event payloads include card/digest identifiers, editor identity, field-level change hashes, latency metrics, and conflict resolution outcomes.
- Maintain an append-only audit log accessible to Ops tooling for compliance reviews; align schema with Intake batch events for analytics consistency.

### Processing Implementation Checklist
- Expand storage and API layers to support versioned cards, edit history, and rescan orchestration (`nuxt-ai-digest/server/utils/digestStore.ts`, `nuxt-ai-digest/server/utils/storage/*`, API routes).
- Build editable card components + composables handling diff view, validation, optimistic concurrency, and conflict prompts.
- Integrate rescan queue hooks, background worker behaviour, and UI status indicators.
- Wire telemetry + audit logging for the new lifecycle events, ensuring configuration via env vars where needed.
- Harden Vitest + Playwright coverage around edit flows, rescans, and failure handling.
- See `docs/tasks/processing-editable-cards.md` for milestone-level task breakdown and coordination notes.

## Implementation Focus
- **Phase 0:** Validate scraper triggers, summarisation settings, and persistence flow against `docs/_archive/specs-03-editable-digest-cards.md`.
- **Phase 1:** Extend the digest schema and storage driver (`nuxt-ai-digest/server/utils/digestStore.ts`, `nuxt-ai-digest/server/utils/storage/*`) to support edit provenance, audit logs, and identity metadata.
- **Phase 2:** Ship the editable-card UX, diffing, validation, conflict handling, and API endpoints (`GET/POST /api/digest/:id/article/:articleId`).
- **Phase 3:** Provide processing-state transitions, rescan orchestration, and background job hooks required for draft resumes and batched reruns.
- **Phase 4:** Surface change signals and edit provenance for Manager review context.
- **Phase 5:** Guarantee exported payloads include the canonical metadata, edit history, and shortlist flags required downstream.
- **Phase 6:** Expand unit/integration coverage for storage drivers, summarisation fallbacks, and component states; participate in feature-flag rollout strategy.

## Testing Strategy
- Unit tests for scraper adapters, summarisation fallbacks, storage driver invariants, and rescan merge logic.
- Component-level tests covering editable cards, diff states, validation errors, conflict prompts, and status chips.
- Integration tests verifying status transitions, audit logging during edits, and telemetry event emission.
- Playwright scenarios spanning Analyst edit, rescan flows, conflict resolutions, and failure handling.

## Current Status (2025-02-14)
- ✅ Phase 1 storage abstraction with edit-ready schema implemented (`nuxt-ai-digest/server/utils/digestStore.ts`).
- ✅ Phase 1 reviewer identity propagation wired through UI + API (`nuxt-ai-digest/app/pages/index.vue`, `nuxt-ai-digest/server/api/digest/index.post.ts`, `nuxt-ai-digest/server/utils/identity.ts`).
- ⏳ Phase 2+ UX, API, and testing enhancements remain **not started**.

## Open Questions
- Which summarisation providers should be prioritised for resilience (fallback ordering, latency budgets)?
- How do we store and present multi-editor histories if several Analysts touch the same card between exports?
