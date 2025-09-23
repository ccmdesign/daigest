---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

The user input can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.

2. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios
   - **ALWAYS**: Read `AGENTS.md` for repository conventions, tooling expectations, and testing guidance
   - **ALWAYS**: Read `docs/specs-05.md` for module roadmaps and cross-module dependencies
   - Derive the module slug from FEATURE_DIR by removing leading digits and dashes (e.g. `001-intake` → `intake`) and load the corresponding repository documentation:
     * If the slug contains `intake`, read `docs/modules/1-intake.md` and `docs/tasks/manual-intake-confirmation.md` when present
     * If the slug contains `processing`, read `docs/modules/2-processing.md` plus `docs/tasks/processing-editable-cards.md`, `docs/tasks/processing-editable-cards-tracker.md`, and `docs/tasks/processing-storage-migration-review.md` when present
     * If the slug contains `output`, `manager`, or `directus`, read `docs/modules/3-output.md` plus `docs/tasks/output-issue-planning.md` and `docs/tasks/output-issue-planning-tracker.md` when present
     * For other slugs, search `docs/modules/` and `docs/tasks/` for files whose names include the slug keyword and ingest any matches
   - Review any module tracker files (files ending with `-tracker.md`) for status, blockers, and coordination notes you must respect during implementation

3. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

4. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding

5. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

6. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

7. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/tasks` first to regenerate the task list.
