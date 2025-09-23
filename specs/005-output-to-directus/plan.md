# Implementation Plan: Output to Directus

**Branch**: `005-output-to-directus` | **Date**: 2025-09-21 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-output-to-directus/spec.md`

## Summary
This plan outlines the implementation of the feature to publish curated cards to an external Directus CMS. This involves creating a service to interact with the Directus API, mapping card data to the Directus schema, and providing UI feedback on the status of the export.

## Technical Context
**Language/Version**: TypeScript (Nuxt)
**Primary Dependencies**: Nuxt 3, Vue 3, a suitable HTTP client for interacting with the Directus API (e.g., `ofetch` which is built into Nuxt, or the official Directus SDK).
**Storage**: Relational DB (SQLite/Supabase)
**Testing**: Vitest, Playwright, MSW (for mocking the Directus API)
**Target Platform**: Server-side (Nuxt server routes)
**Project Type**: Web Application

## Constitution Check
The project constitution is currently a template. No specific gates can be checked.

## Project Structure

### Documentation (this feature)
```
specs/005-output-to-directus/
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
│       └── manager/
│           └── ManagerDashboard.vue # Add "Publish" button and status indicators
└── server/
    ├── api/
    │   └── publish.post.ts      # New endpoint to trigger the publish job
    └── services/
        └── directus.ts          # New service for Directus integration
```

## Phase 0: Outline & Research
Research will focus on:
- The Directus API documentation to understand authentication, data formats, and create/update operations.
- The best way to manage the Directus API key securely.
- Strategies for handling API rate limits and errors.

**Output**: `research.md` with notes on these topics.

## Phase 1: Design & Contracts
1.  **Data Model**: The `data-model.md` will define the mapping between the `Card` entity and the target Directus collection schema.
2.  **API Contracts**: An internal API endpoint `POST /api/publish` will be designed to trigger the export. The contract will be defined in `contracts/publish.oas.yaml`.
3.  **Tests**: Contract tests will be created for the new endpoint.
4.  **Quickstart**: A `quickstart.md` will document how to publish an issue to Directus.

**Output**: `data-model.md`, `contracts/publish.oas.yaml`, failing tests, `quickstart.md`.

## Phase 2: Task Planning Approach
Tasks will be generated to:
- Create a `DirectusService` to handle all communication with the Directus API.
- Implement the `POST /api/publish` endpoint.
- Add a "Publish to Directus" button to the `ManagerDashboard.vue`.
- Display the sync status on each card.
- Write integration tests that mock the Directus API.

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