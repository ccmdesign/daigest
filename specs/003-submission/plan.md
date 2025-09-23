# Implementation Plan: Analyst Card Submission

**Branch**: `003-submission` | **Date**: 2025-09-21 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-submission/spec.md`

## Summary
This plan details the implementation of the feature allowing an Analyst to submit a reviewed card to a Manager. This action transitions the card's state and moves it from the Analyst's queue to the Manager's queue.

## Technical Context
**Language/Version**: TypeScript (Nuxt)
**Primary Dependencies**: Nuxt 3, Vue 3
**Storage**: Relational DB (SQLite/Supabase)
**Testing**: Vitest, Playwright
**Target Platform**: Web Browser
**Project Type**: Web Application
**Structure Decision**: Option 2 (Web application). This feature primarily involves changes to existing components and API endpoints.

## Constitution Check
The project constitution is currently a template. No specific gates can be checked.

## Project Structure

### Documentation (this feature)
```
specs/003-submission/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)
```
# Using Option 2: Web application
nuxt-ai-digest/
├── app/
│   └── components/
│       └── processing/
│           └── EditableCard.vue # Add "Submit" button and logic
└── server/
    └── api/
        └── card/
            └── [id]/
                └── submit.post.ts # New endpoint for submission
```

## Phase 0: Outline & Research
Research will focus on the best way to manage UI state changes upon successful submission, ensuring the card is smoothly removed from the Analyst's view.

**Output**: `research.md` with notes on UI state management.

## Phase 1: Design & Contracts
1.  **Data Model**: The data model is largely defined by the "Processing" feature. This feature focuses on updating the `reviewStage` attribute of the `Card` entity. This will be noted in `data-model.md`.
2.  **API Contracts**: A new API endpoint `POST /api/card/{id}/submit` will be designed. The contract will be defined in `contracts/submission.oas.yaml`.
3.  **Tests**: Contract tests will be created for the new endpoint.
4.  **Quickstart**: A `quickstart.md` will document how to submit a card.

**Output**: `data-model.md`, `contracts/submission.oas.yaml`, failing tests, `quickstart.md`.

## Phase 2: Task Planning Approach
Tasks will be generated to:
- Add a "Submit for Manager Review" button to the `EditableCard.vue` component.
- Implement the `POST /api/card/{id}/submit` endpoint.
- Add client-side logic to call the endpoint and update the UI upon success.
- Write integration tests for the submission flow.

## Progress Tracking
**Phase Status**:
- [ ] Phase 0: Research complete
- [ ] Phase 1: Design complete
- [ ] Phase 2: Task planning complete
- [ ] Phase 3: Tasks generated
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS (template)
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented