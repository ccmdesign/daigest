# Tasks: Manager Review and Curation

**Input**: Design documents from `/specs/004-manager-review-and/`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [ ] T001 [P] Create contract tests for the manager action endpoints (`/shortlist`, `/save`, `/return`) in `nuxt-ai-digest/tests/contract/manager-actions.test.ts`.
- [ ] T002 [P] Create integration test for the manager review workflow in `nuxt-ai-digest/tests/integration/manager-review.test.ts`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T003 [P] Create the `ManagerDashboard.vue` component in `nuxt-ai-digest/app/components/manager/`. This will be the main workspace for managers.
- [ ] T004 [P] Create the `Shortlist.vue` component in `nuxt-ai-digest/app/components/manager/` to display shortlisted cards.
- [ ] T005 [P] Create the `SavedForLater.vue` component in `nuxt-ai-digest/app/components/manager/` to display saved cards.
- [ ] T006 Create the manager dashboard page at `nuxt-ai-digest/app/pages/manager/index.vue`.
- [ ] T007 [P] Implement the `POST /api/card/{id}/shortlist` endpoint in `nuxt-ai-digest/server/api/card/[id]/shortlist.post.ts`.
- [ ] T008 [P] Implement the `POST /api/card/{id}/save` endpoint in `nuxt-ai-digest/server/api/card/[id]/save.post.ts`.
- [ ] T009 [P] Implement the `POST /api/card/{id}/return` endpoint in `nuxt-ai-digest/server/api/card/[id]/return.post.ts`.

## Phase 3.4: Integration
- [ ] T010 Integrate the `ManagerDashboard.vue` and other components into the manager page, including the logic to fetch and display cards awaiting review.
- [ ] T011 Connect the UI actions in the `ManagerDashboard.vue` to the respective API endpoints.

## Phase 3.5: Polish
- [ ] T012 [P] Write unit tests for the `ManagerDashboard.vue` component.

## Dependencies
- T001 and T002 (Tests) must be written before T003-T009 (Core Implementation).
- API endpoints (T007-T009) are needed for the UI integration (T011).
