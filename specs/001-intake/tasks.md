# Tasks: Intake Module

**Input**: Design documents from `/specs/001-intake/`

## Phase 3.1: Setup
- [ ] T001 [P] Configure linting for Vue/TypeScript in `nuxt-ai-digest/` if not already present.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T002 [P] Create contract test for `POST /api/intake` in `nuxt-ai-digest/tests/contract/intake.test.ts`.
- [ ] T003 [P] Create integration test for the URL submission flow in `nuxt-ai-digest/tests/integration/intake.test.ts`. This test should simulate a user pasting URLs and submitting the form.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T004 [P] Create the `URLInputForm.vue` component in `nuxt-ai-digest/app/components/intake/`. This component will contain the textarea and submit button.
- [ ] T005 [P] Create the `SubmissionStatus.vue` component in `nuxt-ai-digest/app/components/intake/`. This component will display feedback to the user after submission.
- [ ] T006 Implement the API endpoint `POST /api/intake` in `nuxt-ai-digest/server/api/intake.post.ts`. This endpoint will handle URL validation, deduplication, and enqueueing.
- [ ] T007 Modify the main page at `nuxt-ai-digest/app/pages/index.vue` to include the `URLInputForm.vue` and `SubmissionStatus.vue` components and handle the form submission logic.

## Phase 3.4: Integration
- [ ] T008 Connect the `POST /api/intake` endpoint to the processing queue/module to trigger card creation.

## Phase 3.5: Polish
- [ ] T009 [P] Write unit tests for the `URLInputForm.vue` component in `nuxt-ai-digest/tests/unit/URLInputForm.test.ts`.
- [ ] T010 [P] Write unit tests for the server-side validation logic in `nuxt-ai-digest/tests/unit/intake-validation.test.ts`.

## Dependencies
- Tests (T002, T003) must be written before core implementation (T004-T007).
- T006 (API endpoint) blocks T007 (frontend integration) and T008 (queue integration).

## Parallel Example
```
# These tests can be developed in parallel:
Task: "Create contract test for POST /api/intake in nuxt-ai-digest/tests/contract/intake.test.ts"
Task: "Create integration test for the URL submission flow in nuxt-ai-digest/tests/integration/intake.test.ts"
```
