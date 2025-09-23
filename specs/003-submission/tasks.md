# Tasks: Analyst Card Submission

**Input**: Design documents from `/specs/003-submission/`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [ ] T001 [P] Create contract test for `POST /api/card/{id}/submit` in `nuxt-ai-digest/tests/contract/submission.test.ts`.
- [ ] T002 [P] Create integration test for the card submission user story in `nuxt-ai-digest/tests/integration/submission.test.ts`. This test should verify that clicking the submit button changes the card's state and removes it from the Analyst's view.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T003 Implement the API endpoint `POST /api/card/{id}/submit` in `nuxt-ai-digest/server/api/card/[id]/submit.post.ts`. This endpoint will change the `reviewStage` of the card to `awaiting_manager`.
- [ ] T004 Add a "Submit for Manager Review" button to the `EditableCard.vue` component in `nuxt-ai-digest/app/components/processing/EditableCard.vue`.
- [ ] T005 Add client-side logic to the `EditableCard.vue` component to call the `POST /api/card/{id}/submit` endpoint and emit a `submitted` event on success.

## Phase 3.4: Integration
- [ ] T006 Update the parent component of `EditableCard.vue` to listen for the `submitted` event and remove the card from the Analyst's review queue.

## Phase 3.5: Polish
- [ ] T007 [P] Write unit tests for the client-side submission logic, including the disabled state of the button when a card is not valid for submission.

## Dependencies
- T001 and T002 (Tests) must be written before T003, T004, and T005 (Core Implementation).
- T003 (API endpoint) is required by T005 (client-side logic).
- T005 is required by T006 (parent component integration).
