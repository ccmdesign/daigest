# Task Breakdown – Output Module Manager Review & Directus Sync

Actionable milestones derived from `docs/modules/3-output.md`. Use this list to drive Output module implementation end-to-end.

[Execution backlog: `docs/tasks/output-issue-planning-tracker.md`]

## Milestone A – Manager Staging & Review UX
- [ ] Implement Manager staging list in `nuxt-ai-digest/app/pages/digest/[id].vue` with status groupings (`new`, `edited`, `needs attention`, `saved`) and inline review controls.
- [ ] Surface Analyst edit badges, confidence warnings, duplicate alerts, and Manager note fields per card.
- [ ] Enable bulk selection and batch assignment/skip actions, including confirmation prompts for conflicting states.

## Milestone B – Issue Planning Board
- [ ] Build multi-lane issue board components under `nuxt-ai-digest/app/components/output/` supporting drag-and-drop, lane pinning, and capacity warnings.
- [ ] Persist lane assignments and ordering via `useIssuePlanner` composable + server APIs; ensure dedupe across lanes.
- [ ] Add saved backlog filters (topic, age) and hero-card pinning UX.

## Milestone C – Directus Integration & Export Pipeline
- [ ] Integrate Directus client with authentication config, environment variables, and health-check diagnostics.
- [ ] Implement export workflow (create/update) with diff preview, required-field validation, and retry/backoff logic.
- [ ] Store Directus entry IDs and sync status per card; expose `retry export` and `view entry` actions post-export.

## Milestone D – Telemetry, Notifications & Audit Logs
- [ ] Emit lifecycle events (`card_reviewed`, `card_assigned_issue`, `export_started`, `export_succeeded`, `export_failed`, `directus_sync_retry`) with schema aligned to Intake/Processing telemetry.
- [ ] Record audit entries capturing Manager identity, action metadata, and Directus responses; persist in storage or dedicated audit table.
- [ ] Wire Slack/email notifications (feature-flagged) summarising export outcomes and error alerts.

## Milestone E – Testing & QA
- [ ] Add unit tests for issue assignment logic, capacity guardrails, Directus payload mapping, and sync status updates.
- [ ] Extend Playwright coverage for staging review, board drag/drop, bulk actions, export success, and remediation of failed exports.
- [ ] Create integration/contract tests against Directus sandbox (or mocks) covering auth failure, schema mismatch, and retry behaviour.

## Open Coordination Items
- Finalise Directus schema mapping (collections, field names) and access tokens with Ops.
- Agree on capacity thresholds and hero-card display rules for issue lanes.
- Decide on notification channels (Slack, email) and message templates for export events.
- Confirm storage strategy for audit logs (existing digest store vs dedicated audit table/service).
