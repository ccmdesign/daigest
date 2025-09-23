# Implementation Plan: Processing Module

**Branch**: `002-processing` | **Date**: 2025-09-21 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-processing/spec.md`

## Summary
This plan covers the implementation of the Processing Module. This involves taking a queued URL, scraping it to create a card, and allowing an Analyst to review, edit, and submit the card. A key part of this feature is persisting both the original and edited card data.

## Technical Context
**Language/Version**: TypeScript (Nuxt)
**Primary Dependencies**: Nuxt 3, Vue 3, ShadCN Vue
**Storage**: JSON file (`data/digests.json`), with a strong requirement to migrate to a relational DB (SQLite/Supabase) to handle edit history.
**Testing**: Vitest, Playwright
**Target Platform**: Web Browser
**Project Type**: Web Application
**Structure Decision**: Option 2 (Web application). New components will be in `nuxt-ai-digest/app/components/processing/`. API logic will be in `nuxt-ai-digest/server/api/`.

## Constitution Check
The project constitution is currently a template. No specific gates can be checked.

## Project Structure

### Documentation (this feature)
```
specs/002-processing/
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
│   ├── components/
│   │   └── processing/      # New components for card editing
│   │       ├── EditableCard.vue
│   │       └── EditHistory.vue
└── server/
    └── api/
        ├── digest/
        │   └── [id].get.ts  # Existing endpoint to be modified
        └── card/
            └── [id].post.ts # New endpoint for editing a card
```

## Phase 0: Outline & Research
Research will focus on:
- Strategies for optimistic UI updates when saving card edits.
- Handling potential conflicts if a card is edited in multiple places or rescanned during an edit.
- Selecting a library for viewing diffs between the original and edited content.

**Output**: `research.md` with notes on these topics.

## Phase 1: Design & Contracts
1.  **Data Model**: The `ArticleRecord` entity will be formally defined with its `edits`, `editMetadata`, and `original` fields in `data-model.md`.
2.  **API Contracts**: A new API endpoint `POST /api/card/{id}` will be designed for submitting edits to a card. The contract will be defined in `contracts/card.oas.yaml`.
3.  **Tests**: Contract tests will be created for the new endpoint.
4.  **Quickstart**: A `quickstart.md` will document the process of reviewing, editing, and submitting a card.

**Output**: `data-model.md`, `contracts/card.oas.yaml`, failing tests, `quickstart.md`.

## Phase 2: Task Planning Approach
Tasks will be generated to:
- Implement the relational database migration (as per `docs/tasks/processing-storage-migration-review.md`).
- Create the `EditableCard.vue` and `EditHistory.vue` components.
- Implement the `POST /api/card/{id}` endpoint.
- Add the logic for submitting a card for manager review.
- Write unit, integration, and end-to-end tests for the editing and submission flows.

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