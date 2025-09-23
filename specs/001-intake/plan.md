# Implementation Plan: Intake Module

**Branch**: `001-intake` | **Date**: 2025-09-21 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-intake/spec.md`

## Summary
This plan outlines the implementation of the Intake Module. The primary goal is to create a web form where Analysts can submit URLs for processing. The system will validate, deduplicate, and enqueue these URLs for the Processing module.

## Technical Context
**Language/Version**: TypeScript (as used in the Nuxt project)
**Primary Dependencies**: Nuxt 3, Vue 3, ShadCN Vue
**Storage**: JSON file (`data/digests.json`), with a planned migration to a relational DB.
**Testing**: Vitest, Playwright
**Target Platform**: Web Browser
**Project Type**: Web Application
**Structure Decision**: Option 2 (Web application) will be used, with the new UI components living in `nuxt-ai-digest/app/components` and the API logic in `nuxt-ai-digest/server/api`.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is currently a template. No specific gates can be checked.

## Project Structure

### Documentation (this feature)
```
specs/001-intake/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Using Option 2: Web application
nuxt-ai-digest/
├── app/
│   ├── components/
│   │   └── intake/          # New components for the intake form
│   │       ├── URLInputForm.vue
│   │       └── SubmissionStatus.vue
│   └── pages/
│       └── index.vue      # Existing page to be modified to include the intake form
└── server/
    └── api/
        └── intake.post.ts # New or existing endpoint to handle URL submission
```

## Phase 0: Outline & Research
No outstanding "NEEDS CLARIFICATION" in the spec. Research will focus on best practices for the existing tech stack.
**Output**: `research.md` will be created with notes on form handling and validation in Vue/Nuxt.

## Phase 1: Design & Contracts
1.  **Data Model**: The primary entities are `URL` and `Card`. The intake process initiates the creation of a `Card`. This will be documented in `data-model.md`.
2.  **API Contracts**: A new API endpoint `POST /api/intake` will be designed to accept a list of URLs. The contract will be defined in OpenAPI format in the `contracts/` directory.
3.  **Tests**: Contract tests will be created for the new endpoint.
4.  **Quickstart**: A `quickstart.md` will be created to document how to use the new intake form.

**Output**: `data-model.md`, `contracts/intake.oas.yaml`, failing tests, `quickstart.md`.

## Phase 2: Task Planning Approach
Tasks will be generated based on the design artifacts. The strategy will be:
- Create Vue components for the intake form.
- Implement the `POST /api/intake` endpoint.
- Add client-side logic to the `index.vue` page to interact with the endpoint.
- Write unit and integration tests for the new components and API endpoint.

## Progress Tracking
**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS (template)
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented