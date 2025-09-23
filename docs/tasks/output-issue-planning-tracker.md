# Output Module Execution Backlog

Derived from `docs/tasks/output-issue-planning.md`. Solo workflow: tackle items in priority order, update checkboxes as progress happens.

## A – Manager Staging & Review UX
- [ ] Build Manager staging list with status groupings and inline review controls.
- [ ] Implement bulk selection + batch assign/skip actions (depends on staging list).

## B – Issue Planning Board
- [ ] Deliver issue planning board with drag/drop, lane persistence, and capacity warnings.
- [ ] Add saved backlog filters and hero-card pinning.

## C – Directus Integration & Export Pipeline
- [ ] Integrate Directus client + env configuration (health check, secrets docs).
- [ ] Implement export workflow (create/update) with diff preview & retries.
- [ ] Persist Directus entry IDs, sync status, and expose retry controls.

## D – Telemetry, Notifications & Audit Logs
- [ ] Emit telemetry + audit logs for Manager actions & exports aligned with Intake/Processing schema.
- [ ] Implement Slack/email notifications (feature-flagged) summarising export outcomes + errors.

## E – Testing & QA
- [ ] Extend unit + Playwright coverage for Manager review, board interactions, export success/failure remediation.

## Coordination
- [ ] Define Directus schema mapping, capacity thresholds, and audit storage strategy (feed results back into Module 3 spec).
