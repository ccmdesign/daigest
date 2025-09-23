# Task Breakdown – Processing Module Editable Cards & Rescan Flow

Translate the Processing module spec (`docs/modules/2-processing.md`) into actionable milestones spanning storage, API, UI, background jobs, and QA.

[Execution backlog: `docs/tasks/processing-editable-cards-tracker.md`]

## Milestone A – Storage & API Foundations
- [ ] Extend `nuxt-ai-digest/server/utils/storage/` drivers with edit provenance fields (`original`, `latest`, `history[]` including editor id, timestamp, diff summary).
- [ ] Update `nuxt-ai-digest/server/utils/digestStore.ts` to expose CRUD helpers for card edits, rescans, and status transitions (`queued`, `processing`, `ready`, `error`).
- [ ] Ship API endpoints for card retrieval and edit submission (`GET /api/digest/:digestId/cards`, `POST /api/digest/:digestId/cards/:cardId/edit`) with validation and identity enforcement via `identity.ts`.
- [ ] Write migration or seed scripts that backfill existing digests into the extended schema (supporting SQLite + Supabase/Postgres).

## Milestone B – Editable Card UX
- [ ] Refactor `nuxt-ai-digest/app/components/ArticleCard.vue` to support edit mode with side-by-side diff, inline validation, provenance badges, and undo/cancel actions.
- [ ] Build shared form controls for summary/title/metadata edits featuring character limits, required-field prompts, and AI-assist call-to-action placeholders.
- [ ] Persist edit drafts locally (e.g., `useCardEditor` composable) so Analysts can stage multiple edits before saving, emitting warning when server data changes underneath.
- [ ] Display edit history timeline per card with editor identity, timestamp, and summary of changes.

## Milestone C – Rescan & Background Jobs
- [ ] Implement rescan request flow from the UI, pushing jobs onto the processing queue and updating card status to `processing` with spinner/state indicators.
- [ ] Add background worker hooks (or mock stubs) that execute rescans, merge new scrape data, and reconcile Analyst edits without overwriting manual fields.
- [ ] Surface retry/timeout feedback for rescans, including ability to cancel or requeue failed attempts.

## Milestone D – Telemetry & Audit Logging
- [ ] Emit structured events for edit lifecycle (`edit_submitted`, `edit_reverted`, `rescan_requested`, `rescan_completed`, `processing_failed`) conforming to module telemetry guidance.
- [ ] Ensure audit log entries include editor identity, affected fields, previous values hash, and processing latency metrics.
- [ ] Integrate telemetry sink selection (local JSON logs vs remote service) and document configuration in `docs/modules/2-processing.md`.

## Milestone E – Testing & QA
- [ ] Add Vitest coverage for storage helpers ensuring history arrays, status transitions, and rescan merge logic remain consistent.
- [ ] Extend Playwright suite with scenarios for edit save/cancel, diff view, rescan request, and error handling.
- [ ] Create contract tests (or mocks) for summarisation providers verifying fallback ordering and latency budgets.

## Open Coordination Items
- Finalise summarisation provider priority list and acceptable latency thresholds for fallbacks.
- Decide on diff library usage (existing utility vs new dependency) for human-readable change summaries.
- Align with Output module on required edit metadata surface area (e.g., field-level provenance vs card-level summary) to avoid schema churn later.
