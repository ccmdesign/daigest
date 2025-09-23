# Intake Module – Link Intake & Curation

## Overview
The Intake module captures every link Analysts collect during the week and hands those URLs off to the Processing module for card generation. Analysts submit links through the Nuxt form (Slack and other sources come later), the system immediately enriches each URL, and the resulting cards flow through the Processing and Output modules for review and publication.

## Responsibilities
- Accept URLs from manual entry today and, in Phase 2+, from Slack or batching helpers.
- Validate, normalise, and de-duplicate URLs before dispatching them to the processing pipeline.
- Emit telemetry for each queue mutation so downstream agents can monitor saturation and error trends.
- Maintain basic intake metadata (submitter, timestamps, source) for auditing and analytics, while leaving card editing to the Processing module.

## Key User Interactions
- Analysts paste one or many URLs into the intake form; the UI highlights detected domains and prevents empty submissions.
- The system immediately enqueues those URLs for enrichment and streams card progress back to the same page.
- Analysts clear results and submit new batches as they continue discovery work throughout the week.

## Intake → Processing Workflow
1. Analyst submits URLs via the intake form.
2. Intake validates each URL and forwards the list to the Processing module.
3. Processing creates cards, surfaces enrichment status, and exposes editing tools for the Analyst.
4. Analyst reviews/edits the cards inside Processing; confirmed cards advance to the Manager view via the Output module.
5. Manager reviews, edits, and publishes cards; Intake prevents re-ingesting URLs already marked as Manager or Published cards.

## Implementation Focus
- **Phase 0:** Audit the existing manual form (`docs/_archive/codex-nuxt-implementation.md`) to confirm queue semantics, reviewer tagging, and telemetry coverage.
- **Phase 1:** Maintain the manual submission flow while migrating storage to the shared relational abstraction (SQLite locally, Supabase/Postgres in production); ensure duplicate lookups can reference Manager/Published pools.
- **Phase 2:** Reintroduce Slack and automated feeds behind the same validation/telemetry pipeline, coordinating reruns with Processing when Analysts request rescans.
- **Phase 3:** Add resume tooling (draft digests, append-only batches, retry helpers) that respects ongoing Processing jobs.
- **Phase 4:** Surface backlog metrics (Analyst vs. Manager vs. Published counts) so Managers can see intake volume at a glance.
- **Phase 5:** When exports trigger reprocessing, feed those requests back through Intake while preventing duplicates against Published cards.
- **Phase 6:** Ship connector mocks, integration tests, and environment setup documentation; gate new behaviours behind module-specific feature flags.

## Decisions
- No per-Analyst or per-channel rate limiting for now; small launch cohorts keep ingestion volume low and simplify Intake.
- Defer Slack intake to Phase 2 so the manual flow and downstream editing experience stabilise first.

## Telemetry Schema
- Emit structured JSON for every queue mutation using the agreed schema:
  - `timestamp` (ISO 8601) and `eventType` (`enqueue`, `dequeue`, `retry`, `failure`, `metric`).
  - `jobId`, `digestId`, and `source` (`manual`, `slack`, `automation`).
  - `status` (`queued`, `processing`, `completed`, `failed`) plus `failureReason` (enum) and `retryCount` when relevant.
  - `queueSize` (post-event depth), `latencyMs`, and optional `metadata` for diagnostics.
  - Log aggregation should treat this schema as canonical so automated analyzers can parse it deterministically.

## Current Status (2025-02-14)
- Phase 0 groundwork identified; manual submission posts directly to the processing pipeline with duplicate checks handled during card review.
- Phase 1+ storage migration, Slack feeds, and advanced backlog tooling remain **not started**.

## Testing Strategy
- Unit and integration tests for the manual form submission flow (validation, duplicate detection, telemetry emission).
- Connector contract tests for Slack webhook payloads once Phase 2 lands.
- Playwright coverage for multi-session link submission and retry flows.
- Regression tests ensuring processed/published URLs are not re-queued without Analyst consent.
