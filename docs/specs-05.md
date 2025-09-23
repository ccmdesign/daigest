# Implementation Plan – Intake · Processing · Output Modules

We now scope workstreams around three major modules. Detailed expectations, test suites, and open questions live in the dedicated module briefs listed below. This document stays as the cross-module index for planning cadence and status tracking.

## Module Playbooks
- `docs/modules/1-intake.md` — link capture, queue management, and Analyst intake scenarios.
- `docs/modules/2-processing.md` — enrichment pipelines, editable cards, and status management.
- `docs/modules/3-output.md` — Manager review, shortlist approvals, and export/distribution tooling.

## Roadmap Snapshot
- **Phase 0 – Foundation Review:** Confirm current behaviour across intake surfaces, processing pipelines, and manager/export touchpoints before layering new work.
- **Phase 1 – Persistent Workspace & Identity Hooks:** Land the relational storage abstraction, edit-ready schema, and reviewer identity wiring shared by Intake, Processing, and Output.
- **Phase 2 – Editable Cards:** Deliver Processing-led editable card UX and APIs, ensuring Intake reruns and Output exports respect Analyst overrides.
- **Phase 3 – Analyst Workflow Enhancements:** Focus on Intake-powered draft resumes, retries, and batching while exposing the Processing states and Output guardrails those flows require.
- **Phase 4 – Manager Review & Shortlisting:** Expand Output review tooling, backed by Processing change signals and Intake backlog metrics.
- **Phase 5 – Export Automation:** Extend Output exports, coordinate metadata guarantees with Processing, and loop reprocessing requests back through Intake queues.
- **Phase 6 – Quality & Rollout:** Harden tests and telemetry across all modules, and manage feature-flag graduation.

## Status (2025-02-14)
- ✅ Phase 1 storage abstraction with edit-ready schema implemented (`nuxt-ai-digest/server/utils/digestStore.ts`).
- ✅ Phase 1 reviewer identity propagation live through UI + API (`nuxt-ai-digest/app/pages/index.vue`, `nuxt-ai-digest/server/api/digest/index.post.ts`, `nuxt-ai-digest/server/utils/identity.ts`).
- ✅ Phase 1 shortlist functionality persisted with summary counters and per-record flags (`nuxt-ai-digest/app/components/ArticleCard.vue`, `nuxt-ai-digest/tests/digestStore.test.ts`).
- ⏳ Phase 2+ module workstreams are **not started**.

## Next Steps
- Intake: finalise relational driver selection (SQLite vs. Supabase) and migration tooling.
- Processing: document the editable-card API contract and add regression fixtures for summarisation pipelines.
- Output: prototype export format validators to unblock the Output regression suite.
