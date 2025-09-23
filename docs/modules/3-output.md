# Output Module – Review, Issue Planning & Directus Sync

## Overview
The Output module governs Manager review workflows, newsletter issue planning, and downstream publishing. Instead of handing off RSS/JSON files, the module now integrates directly with Directus CMS to create and schedule content entries for upcoming issues. It ensures curated content leaves the system with clear provenance while giving Managers tooling to stage newsletters and manage "save for later" pools.

## Responsibilities
- Provide Manager-facing views with filters for new, edited, shortlisted, and saved-for-later cards.
- Persist shortlist decisions, issue assignments (upcoming vs. backlog), reviewer identity, and summary counters for analytics.
- Push curated cards to Directus as structured entries, updating or scheduling them according to the selected newsletter issue.
- Record export events, timestamps, Directus entry IDs, and any follow-up automation requests.
- Maintain card placement across Analyst, Manager, and Published lists so duplicates are prevented even when cards are staged for future issues.

## Key User Interactions
- Managers review processed cards, make edits when necessary, and decide whether each card belongs in the upcoming newsletter issue or the saved-for-later pool.
- Managers initiate exports that push cards directly into Directus collections for the chosen issue or backlog; manual downloads remain optional but secondary.
- In the future, Managers organise multiple issue dropzones (e.g. Issue #45, Issue #46) and drag cards between them to plan several newsletters simultaneously, with corresponding Directus schedules.
- System automation may schedule exports or notify downstream services based on publication criteria.

## Manager Review Flow
- **Triage Queue:** Incoming cards land in the Manager staging view grouped by shortlist status (`new`, `edited`, `needs attention`, `saved`). Cards surface Analyst edits, confidence score, duplicate warnings, and saved-for-later tags.
- **Inline Review:** Managers can tweak summary copy, add manager notes, or flag cards for follow-up. Inline validation mirrors Processing guardrails and highlights disagreements between Analyst edits and Manager overrides.
- **Assignment Controls:** Cards include quick actions to assign to the upcoming issue, move to saved backlog, or skip entirely. Issue assignment prompts the Manager to select a target issue slot (defaulting to the current week) while saved backlog requests a category tag.
- **Bulk Operations:** Managers can multi-select cards to batch-assign them to issues, archive them, or trigger exports; conflicts solicit confirmations before applying.
- **Audit Surface:** Every action reveals who made the change, when it happened, and which fields changed. Managers can expand cards to inspect full edit history prior to publishing.

### Issue Planning Board
- Issue view presents lanes for `Current issue`, `Next issue`, `Saved backlog`, and optional custom slots. Each lane lists assigned cards in priority order with drag-and-drop reordering.
- Cards display key metadata (title, summary snippet, tags, confidence, edit badges) plus a Directus sync status indicator (`not exported`, `pending`, `synced`, `error`).
- Managers can pin hero cards or mark capacity thresholds (e.g., 8-card recommendation) with warning banners when limits are exceeded.
- Saved backlog supports filters by topic or age so Managers can resurface aging content quickly.

### Export & Directus Sync Pipeline
- Export initiation prompts Managers to confirm the issue slot, choose optional fields (Manager notes, Analyst quotes), and review the export diff.
- Directus integration handles create vs. update semantics based on stored Directus entry IDs, with conflict detection and manual override prompts.
- After export, the system posts a summary (issue id, card count, Manager identity, Directus entry links) to telemetry and optional Slack notifications.
- Failed exports retry with exponential backoff; once retries exhaust, cards flip to `export_failed` with remediation guidance and `retry export` controls.

### Validation & Guardrails
- Issue lanes enforce soft limits; warnings surface when Managers exceed configured card counts or include too many low-confidence cards.
- Cards cannot be exported without mandatory fields (title, summary, source URL) or without acknowledging low-confidence warnings.
- Saved backlog enforces dedupe: cards must exist in exactly one lane; moving a card updates all queue references across modules.
- Permission checks restrict publishing to authorised roles, while contributors operate in recommendation mode with approval requirements.

### Telemetry & Reporting
- Emit lifecycle events (`card_reviewed`, `card_assigned_issue`, `card_saved_backlog`, `export_started`, `export_succeeded`, `export_failed`, `directus_sync_retry`).
- Event payloads include digest/issue identifiers, Manager identity, card counts, latency metrics, Directus response hashes, and confidence thresholds at export time.
- Provide daily summary metrics (cards reviewed, exported, errors, backlog age) surfaced in dashboards and optionally pushed to Slack.

### Output Implementation Checklist
- Build Manager staging and board views in Nuxt (`nuxt-ai-digest/app/pages/digest/[id].vue`, new components under `nuxt-ai-digest/app/components/output/`).
- Implement assignment state management and bulk operations via a dedicated store/composable (`useIssuePlanner`).
- Integrate Directus SDK/client with retries, conflict detection, and error surfacing; persist Directus entry identifiers in card records.
- Wire telemetry and audit logging for review/export actions, aligning payloads with Intake and Processing schemas for analytics consistency.
- Add notification hooks (Slack/email) behind feature flags to announce export success/failure to stakeholders.
- Harden unit/integration/Playwright coverage around Manager review, board interactions, and export lifecycle behaviour.
- See `docs/tasks/output-issue-planning.md` for milestone-level breakdown and coordination notes.

## Implementation Focus
- **Phase 0:** Inventory current Manager review surfaces and export stubs referenced across existing specs.
- **Phase 1:** Thread reviewer identity into shortlist actions and export audit logs so approvals are attributable; document Directus collection schemas.
- **Phase 2:** Ensure exports hydrate edited content, display modified-field annotations, surface Manager staging view filters, and stay aligned with Processing schema.
- **Phase 3:** Reflect draft vs. published state in Manager dashboards, implement assignment controls, and persist issue/backlog decisions.
- **Phase 4:** Deliver issue planning board with multi-lane support, capacity warnings, and bulk operations.
- **Phase 5:** Replace RSS/JSON handoffs with Directus integration (auth, schema mapping, retries) and store Directus entry IDs per card.
- **Phase 6:** Introduce the saved-for-later backlog within Directus, syncing status across modules to prevent duplicates.
- **Phase 7:** Explore multi-dropzone scheduling (multiple future issues) with drag/drop UX tied to Directus publish dates and automation hooks.
- **Phase 8:** Automate shortlist regression tests, Directus export validators, Manager-centric Playwright coverage, and manage feature-flag rollouts (`NUXT_ENABLE_CARD_EDITS`, `NUXT_ENABLE_SHORTLISTING`, upcoming Output flags).

## Testing Strategy
- Unit tests for shortlist logic, issue assignment state (upcoming vs. saved backlog), Directus payload mapping, sync status indicators, and capacity guardrails.
- Contract tests against a Directus test instance or mocked client to confirm authentication, create/update semantics, retries, and error handling.
- Integration tests for publication triggers, audit logging, export retries, multi-issue routing, and telemetry events.
- Playwright scenarios for Manager review, filtering, board drag/drop, bulk assignment, export initiation, Directus sync confirmation, and error remediation flows.

## Current Status (2025-02-14)
- ✅ Phase 1 shortlist functionality persisted with summary counters and per-record flags (`nuxt-ai-digest/app/components/ArticleCard.vue`, `nuxt-ai-digest/tests/digestStore.test.ts`).
- ✅ Phase 1 reviewer identity propagation available for shortlist actions (`nuxt-ai-digest/app/pages/index.vue`, `nuxt-ai-digest/server/api/digest/index.post.ts`).
- ⏳ Phases 2+ export and review enhancements remain **not started**.

## Open Questions
- Which Directus collections and field schema should we target for newsletter issues vs. saved backlog entries?
- How should we integrate publishing approvals with external tooling (Slack notifications, ticketing, etc.)?
- What interaction model best supports multi-dropzone planning (drag-and-drop, multi-select menus, keyboard shortcuts) without overwhelming Managers?
