# Processing Module Execution Backlog

Single-person backlog derived from `docs/tasks/processing-editable-cards.md`. Work top-to-bottom; update status inline as tasks move.

## A – Storage & API Foundations
- [ ] Extend storage drivers and digest store for edit provenance + status transitions (see `docs/tasks/processing-storage-migration-review.md`).
- [ ] Ship card retrieval & edit submission API endpoints with identity enforcement (blocked by storage update).

## B – Editable Card UX
- [ ] Build editable `ArticleCard` UX with diffing, validation, and draft handling.
- [ ] Implement edit history timeline component + provenance badges.

## C – Rescan & Background Jobs
- [ ] Wire rescan request flow, queue hooks, and status indicators.
- [ ] Deliver rescan worker logic with merge + conflict handling for Analyst overrides.

## D – Telemetry & Audit Logging
- [ ] Emit telemetry + audit logs for edit/rescan lifecycle events aligned with Intake schema.

## E – Testing & QA
- [ ] Extend Vitest & Playwright coverage for edit, rescan, and failure flows.

## Coordination
- [ ] Finalise summarisation provider priorities, diff library, and Output metadata requirements.
