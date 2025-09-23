# Tasks: Processing Module

**Input**: Design documents from `/specs/002-processing/`

## Phase 3.1: Setup
- [ ] T001 Implement the relational database migration. This includes writing migration scripts (e.g., using Drizzle or Prisma) and updating the storage driver in `nuxt-ai-digest/server/utils/storage/` to support SQLite for local development and Supabase/Postgres for production.
- [ ] T002 [P] Install `diff-match-patch` or a similar library for showing text diffs.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [ ] T003 [P] Create contract test for `POST /api/card/{id}` in `nuxt-ai-digest/tests/contract/card.test.ts`.
- [ ] T004 [P] Create integration test for the Analyst card editing and submission flow in `nuxt-ai-digest/tests/integration/processing.test.ts`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T005 [P] Create the `EditableCard.vue` component in `nuxt-ai-digest/app/components/processing/`. This component will handle the inline editing of card fields.
- [ ] T006 [P] Create the `EditHistory.vue` component in `nuxt-ai-digest/app/components/processing/` to display the audit trail of edits.
- [ ] T007 Implement the `ArticleRecord` data model in the new relational database, including the `Edit History` table.
- [ ] T008 Implement the API endpoint `POST /api/card/{id}` in `nuxt-ai-digest/server/api/card/[id].post.ts`. This endpoint will save edits to the database and handle version conflicts.
- [ ] T009 Implement the logic to change a card's `reviewStage` to `awaiting_manager` when an Analyst submits it.
- [ ] T010 Update the main card display area to use the new `EditableCard.vue` component.

## Phase 3.4: Integration
- [ ] T011 Integrate the `EditHistory.vue` component to show the history of edits for a card.
- [ ] T012 Implement the server-side logic for the "rescan" feature, which re-runs the scraping process for a URL.

## Phase 3.5: Polish
- [ ] T013 [P] Write unit tests for the `EditableCard.vue` component.
- [ ] T014 [P] Write unit tests for the conflict handling logic on the server.

## Dependencies
- T001 (DB migration) blocks T007 (data model implementation) and T008 (API endpoint).
- Tests (T003, T004) must be written before core implementation (T005-T010).
