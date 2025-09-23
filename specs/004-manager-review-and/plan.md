# Implementation Plan: Manager Review and Curation

**Branch**: `004-manager-review-and` | **Date**: 2025-09-21 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-manager-review-and/spec.md`

## Summary
This plan outlines the implementation of the Manager-facing features for reviewing and curating cards. This includes a dedicated workspace for Managers, and the ability to shortlist cards for a newsletter, save them for later, or return them to the Analyst for revision.

## Technical Context
**Language/Version**: TypeScript (Nuxt)
**Primary Dependencies**: Nuxt 3, Vue 3
**Storage**: Relational DB (SQLite/Supabase)
**Testing**: Vitest, Playwright
**Target Platform**: Web Browser
**Project Type**: Web Application
**Structure Decision**: Option 2 (Web application). This will involve creating a new set of components for the Manager workspace.

## Constitution Check
The project constitution is currently a template. No specific gates can be checked.

## Project Structure

### Documentation (this feature)
```
specs/004-manager-review-and/
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
│   │   └── manager/         # New components for the manager workspace
│   │       ├── ManagerDashboard.vue
│   │       ├── Shortlist.vue
│   │       └── SavedForLater.vue
│   └── pages/
│       └── manager/         # New page for the manager workspace
│           └── index.vue
└── server/
    └── api/
        └── card/
            └── [id]/
                ├── shortlist.post.ts
                ├── save.post.ts
                └── return.post.ts
```

## Phase 0: Outline & Research
Research will focus on:
- Best practices for building dashboard interfaces with filtering and sorting in Vue.
- UI/UX for providing feedback when a card is returned to an Analyst.

**Output**: `research.md` with notes on these topics.

## Phase 1: Design & Contracts
1.  **Data Model**: This feature primarily involves updating the `reviewStage` of the `Card` entity. The new stages (`shortlisted`, `saved_for_later`, `needs_revision`) will be documented in `data-model.md`.
2.  **API Contracts**: New API endpoints will be designed for each manager action:
    - `POST /api/card/{id}/shortlist`
    - `POST /api/card/{id}/save`
    - `POST /api/card/{id}/return`
    These will be defined in `contracts/manager-actions.oas.yaml`.
3.  **Tests**: Contract tests will be created for the new endpoints.
4.  **Quickstart**: A `quickstart.md` will document the manager's workflow.

**Output**: `data-model.md`, `contracts/manager-actions.oas.yaml`, failing tests, `quickstart.md`.

## Phase 2: Task Planning Approach
Tasks will be generated to:
- Create the `ManagerDashboard.vue` and other manager-specific components.
- Implement the new API endpoints for manager actions.
- Add the client-side logic to call these endpoints from the manager dashboard.
- Write integration tests for the complete manager workflow.

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