# Storage & API Migration Review – Processing Module

Context: Processing milestones PROC-01/PROC-02 require moving from the JSON driver to a relational driver that works locally (SQLite) and in production (Supabase/Postgres). Use this brief as a solo decision checklist before diving into implementation.

## Current State
- **Driver:** `JsonDigestStoreDriver` (`nuxt-ai-digest/server/utils/storage/jsonDriver.ts`) writes digests to filesystem.
- **Schema:** `PersistedDigest` holds flattened article records with optional `original`, `edits`, `editMetadata` fields but lacks version history arrays or audit log constructs.
- **API:** `/api/digest/index.post.ts` persists digests; no per-card retrieval/update endpoints yet.

## Migration Goals
1. Support richer card history (versioned edits, provenance, audit metadata) without breaking existing digests.
2. Provide a relational storage layer selectable via config (`sqlite` for local dev/tests, `supabase` for hosted environments).
3. Expose CRUD APIs for cards that operate on the relational model.
4. Keep Playwright/Vitest suites fast; prefer in-memory SQLite in CI.

## Proposed Data Model
| Table | Key Fields | Notes |
| --- | --- | --- |
| `digests` | `id`, `created_at`, `summary_json`, `metadata_json` | Summary + top-level metadata stored as JSONB (Postgres) / TEXT (SQLite).
| `digest_articles` | `id`, `digest_id`, `url`, `original_json`, `latest_json`, `status`, `confidence`, `shortlisted`, `created_at`, `updated_at` | `latest_json` reflects current Analyst-facing card.
| `article_edits` | `id`, `article_id`, `editor_id`, `diff_json`, `notes`, `created_at` | Append-only history for audit + undo/redo.
| `article_events` (optional) | `id`, `article_id`, `type`, `payload_json`, `created_at` | Telemetry/audit sink if you do not rely solely on external logging.

## Driver Strategy
- **SQLite (local/CI):** use `better-sqlite3` for sync operations or `sqlite3`/Prisma as async; store DB file under `data/intake.sqlite` with migrations via `drizzle` or `knex`.
- **Supabase/Postgres (prod):** reuse migration definitions via SQL files; connect using `pg` driver with pooled connections.
- Driver factory resolves based on `DIGEST_STORE_DRIVER` env (`json`, `sqlite`, `supabase`).

## Migration Plan
1. **Migrations:** author SQL/Drizzle schema for both environments. Ensure JSON columns degrade gracefully in SQLite (TEXT + manual serialisation).
2. **Backfill Script:** create CLI (`npm run migrate:digests`) that reads existing JSON digests and inserts into relational tables with synthetic edit history (single entry representing current state).
3. **Configuration:** extend `configureDigestStore` to accept DSN/credentials; document `.env` entries (`DATABASE_URL`, `SUPABASE_SERVICE_KEY`).
4. **Testing:** update Vitest setup to initialise in-memory SQLite and seed sample digests for edit/rescan tests.
5. **Rollback:** define downgrade path (export relational data back to JSON) for local workspaces that need a reset.

## Decisions to Lock Before Coding
1. **Migration Framework:** Drizzle vs. Prisma vs. raw SQL migrations (trade-offs: ergonomics, build size, CI complexity).
2. **Driver Implementation:** Single abstraction layer for SQLite/Supabase or separate adapters optimised per target.
3. **Backfill Scope:** Preserve existing JSON digests or start fresh with new relational schema + optional import script.
4. **CI Strategy:** Accept SQLite native deps (e.g. `better-sqlite3`) in CI container vs. pure JS alternative.
5. **Supabase Access:** Decide on connection method (service role vs. anon) and pooling strategy for background jobs.
6. **Audit Storage:** Keep audit trail in relational tables vs. external telemetry sink; impacts schema now.

## Recommended Next Steps
- Resolve the decisions above (capture choices inline or in commit notes for future reference).
- Update `docs/tasks/processing-editable-cards-tracker.md` if new sub-tasks emerge while planning.
- Draft migration scripts with the selected tooling; create a spike branch if experimentation is needed.

*Prepared: 2025-02-21*
