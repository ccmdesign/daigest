# use cases

## Review/edit card content - Analyst
As an analyst, I want to review the metadata enriched by AI to make sure that it is correct based on the links I pasted for the AI. So the AI will receive the link, scrape the data, create a card and I will review that card. If that card is not showing correct information, I will edit that card, update that information manually so the card has the correct information.

## Submit Card - Analyst
As an analyst, I want to approve the card that I just created or reviewed—or whatever. The card is sent to the manager.

## Review Cards - Manager
As a manager, I want to review the cards that I receive, and I want to edit the content if I would like to.

## Shortlist Card - manager
As a manager, I want to shortlist a card to go to the next issue of the newsletter.

## Save card for later - Manager
As a manager, I want to save a card for later because I like that card, but I don't want to send it straight to the next issue—I want to save it for another issue.

---

# Feature specifications

## Lifecycle Alignment
- **Pipeline status (`records[].status`)** already shipped under `nuxt-ai-digest/server/utils/storage/types.ts` covers ingestion progress: `queued → processing → ready → error`. Analyst-facing stories begin once a record is `status: 'ready'`.
- **New review stage (`records[].reviewStage`)** lives as a top-level field beside `status` in `PersistedArticleRecord` to track human workflow. Proposed enum: `analyst_review`, `awaiting_manager`, `needs_revision`, `shortlisted`, `saved_for_later`.
- **Schema delta:** extend `nuxt-ai-digest/server/utils/storage/types.ts` (and backing drivers) with the new `reviewStage` field. Legacy records fall back to `analyst_review`, while any card marked `shortlisted: true` is normalised to `reviewStage: 'shortlisted'` to preserve downstream behaviour.
- **Shortlist flag (`records[].shortlisted`)** remains the authoritative toggle consumed by Output automation; review stages should set/clear it instead of introducing a parallel field.
- **Audit metadata (`updatedBy`, `submittedBy`, `managerUpdatedBy`, etc.)** lives inside `records[].editMetadata`/history entries rather than the root record to keep compat with current API contracts.
- **Notifications/events** reuse existing telemetry pipeline; new events (`card_review_saved`, etc.) extend payloads but keep topic names consistent with `docs/modules/2-processing.md` guidance.

## Feature: Analyst card review and edit
### Feature description
Enable analysts to open any AI-generated card in a queue, compare it against the original source, and correct metadata (headline, summary, tags, entities, relevance score, etc.) before handing the card off to the next stage.

### Goals
- Ensure analysts can confidently trust card accuracy prior to submission.
- Preserve source traceability and change history for compliance/debugging.
- Maintain card lifecycle continuity without forcing analysts to leave the review context.

### Non-goals
- Rebuilding the scraping pipeline or AI enrichment process.
- Introducing collaborative editing or real-time presence between analysts.

### User workflow
- Analyst opens a card surfaced with `status: 'ready'` and `reviewStage: 'analyst_review'` from the review queue.
- Analyst inspects scraped data alongside key metadata and the original source link.
- Analyst edits any incorrect fields (text, picklists, tags) and can reset AI-generated content if needed.
- Analyst saves changes; the system updates audit fields (`updatedAt`, `updatedBy`) and returns to the queue with latest data rendered.

### Acceptance criteria
- Cards in `reviewStage: 'analyst_review'` are fetchable with full metadata payload and link back to the source artifact.
- Editor supports inline editing for summary, title, tags, sentiment, entities, relevance, and manual attachments; validation prevents empty required fields.
- Saving persists edits, records `updatedBy` and versions the previous payload for audit.
- UI surfaces a change log (timestamp + field diff) or at minimum a badge indicating the last editor/time.
- Errors while saving surface actionable feedback without losing unsaved edits.

### Implementation tasks
- Backend
  - Extend storage types/drivers with top-level `reviewStage` and ensure existing digests migrate with defaults.
  - Extend card fetch endpoint to include audit metadata, AI confidence scores, and source link while preserving `status` values.
  - Add update endpoint accepting partial edits, enforcing field validation, and writing to revision history table/log.
  - Introduce a `reviewStage: 'analyst_review'` guard that prevents escalation until required fields are populated.
- Frontend
  - Build review detail view with editable form components, diff indicators, and inline validation.
  - Display read-only AI-generated values alongside editable fields to highlight what changed.
  - Provide optimistic UI save with error states and loading indicators.
- QA/Telemetry
  - Add analytics event for `card_review_saved` with diff metadata (field types changed).
  - Write test cases covering required-field validation, failed save handling, and audit log visibility.

## Feature: Analyst submit card
### Feature description
Allow analysts to promote a reviewed card from `reviewStage: 'analyst_review'` to `reviewStage: 'awaiting_manager'`, signaling that the content is vetted and awaiting manager review.

### Goals
- Provide an explicit state transition that hands work off to managers with confidence.
- Prevent accidental submission when required fields are missing or stale.

### Non-goals
- Automating manager assignment or scheduling newsletter issues.

### User workflow
- Analyst selects `Submit for manager review` from the card review screen.
- System validates that the card meets completeness criteria (required fields filled, source link present, no blocking errors).
- Submission shifts `reviewStage` from `analyst_review` to `awaiting_manager`, logs submission metadata, and optionally notifies the assigned manager.

### Acceptance criteria
- Submission action is available only when validation passes; disabled state explains blockers.
- Upon submission, card `reviewStage` transitions to `awaiting_manager` and `submittedBy`/`submittedAt` metadata is stored inside edit history.
- Manager queue receives the card and analyst no longer sees it in the `analyst_review` list.
- System emits notification/webhook/event for the assigned manager or manager group.

### Implementation tasks
- Backend
  - Add submission endpoint that performs server-side validation and transitions `reviewStage` atomically.
  - Record submission metadata and enqueue manager notification job.
- Frontend
  - Add submission CTA with confirmation modal summarizing fields that will be locked post-submission.
  - Update analyst queue views to filter out `awaiting_manager` cards.
- QA/Telemetry
  - Instrument `card_submitted` event including card ID, analyst ID, and validation outcome.
  - Create test scenario covering successful submission and failure when validation fails.

## Feature: Manager review cards
### Feature description
Provide managers with a review workspace where they can read analyst-submitted cards (`reviewStage: 'awaiting_manager'`), make targeted edits, and decide the card's next state (shortlist, save for later, or return for rework).

### Goals
- Centralize manager review on cards that have passed analyst validation.
- Preserve edit traceability and support collaborative feedback loop with analysts.

### Non-goals
- Assigning cards to specific issues automatically; that is handled by shortlist/save actions.
- Implementing threaded comments (tracked separately).

### User workflow
- Manager opens their review queue filtered to cards with `reviewStage: 'awaiting_manager'`.
- Manager inspects card content, compares with source, and optionally edits fields to polish messaging.
- Manager chooses an outcome: shortlist, save for later, or return to analyst with comments.

### Acceptance criteria
- Manager queue lists `reviewStage: 'awaiting_manager'` cards sorted by submission time, with filters for tags, source type, and analyst.
- Manager editing surface mirrors analyst editor but clearly labels manager overrides.
- Saving manager edits updates `managerUpdatedBy` metadata and preserves analyst edits in history.
- Manager can add optional feedback notes when returning a card to analysts; card `reviewStage` changes to `needs_revision` and notifies the analyst while keeping `status: 'ready'` intact.
- Activity log shows the full state transition path (`analyst_review → awaiting_manager → manager action`) with timestamps.

### Implementation tasks
- Backend
  - Extend card model to capture manager-specific audit fields and optional feedback notes without mutating ingestion `status` values.
  - Provide API to list cards for managers with filtering/sorting parameters.
  - Support review-stage transitions to `shortlisted`, `saved_for_later`, or `needs_revision` with corresponding notifications, persisting the top-level `reviewStage` field.
  - Expose `PATCH /api/digest/:digestId/records/:recordId` to update `reviewStage`/`shortlisted`, recalc shortlist counts, and stamp `lastReviewedAt`.
- Frontend
  - Build manager dashboard view with batch filters and card preview list.
  - Add manager editor UI with feedback note input and outcome buttons.
- QA/Telemetry
  - Capture `card_manager_reviewed`, `card_returned_to_analyst` events with metadata.
  - Test scenarios for each outcome and ensure audit log display is accurate.

## Feature: Manager shortlist card
### Feature description
Allow managers to designate high-priority cards for the upcoming newsletter issue, creating a curated shortlist ready for content assembly.

### Goals
- Provide a clear pipeline from manager review to publish-ready shortlist.
- Track shortlist order and readiness for downstream publishing automation.

### Non-goals
- Generating the final newsletter issue or scheduling distribution.

### User workflow
- From a card in manager review, manager selects `Shortlist for next issue`.
- System prompts for optional placement metadata (section, priority rank) and verifies the card is in `reviewStage: 'awaiting_manager'`.
- Card sets `reviewStage` to `shortlisted`, flips `shortlisted: true`, appears in shortlist view, and is removed from general review queue.

### Acceptance criteria
- Shortlist action available only on cards with `reviewStage: 'awaiting_manager'`.
- Card records shortlist metadata (issue ID/placeholder, section, priority) and `shortlistedBy/At` fields while maintaining `status: 'ready'`.
- Shortlist list view displays cards ordered by priority and includes quick links back to full card detail.
- Downstream automation can query shortlist endpoint to fetch publish-ready cards using existing `shortlisted` flag plus new metadata.

### Implementation tasks
- Backend
  - Create shortlist mutation with idempotency to prevent duplicate shortlisting.
  - Extend data model to store shortlist metadata and ensure transitions to other review stages are prohibited while `shortlisted: true` unless explicitly un-shortlisted (update top-level `reviewStage` accordingly).
- Frontend
  - Add shortlist modal/form collecting optional placement metadata.
  - Build shortlist tab showing prioritized cards with drag-and-drop or manual ordering (MVP: manual ranking inputs).
- QA/Telemetry
  - Emit `card_shortlisted` analytics with placement metadata.
  - Tests verifying state enforcement and shortlist ordering persistence.

## Feature: Manager save card for later
### Feature description
Let managers bookmark cards that are valuable but not appropriate for the immediate issue, ensuring they remain discoverable for future editions.

### Goals
- Provide backlog management for managers to revisit strong but non-urgent cards.
- Avoid losing analyst effort when timing is not right for a specific issue.

### Non-goals
- Automated resurfacing logic beyond basic reminders/filters.

### User workflow
- Manager selects `Save for later` from the manager review actions.
- System requires an optional note/reason and transitions the card to `reviewStage: 'saved_for_later'` with `shortlisted: false`.
- Saved cards move to a dedicated view with sorting by tags, analyst, and saved date.

### Acceptance criteria
- Action only available on cards with `reviewStage: 'awaiting_manager'`.
- Card `reviewStage` updates to `saved_for_later` with metadata (`savedBy`, `savedAt`, optional note, target revisit window) stored in edit history.
- Saved cards excluded from shortlist and standard review queues but accessible via dedicated filter/view.
- Managers can re-activate saved cards, returning them to `reviewStage: 'awaiting_manager'` or directly shortlisting when timing fits.

### Implementation tasks
- Backend
  - Implement save-for-later mutation capturing reason and optional revisit date; allow reactivation workflow that returns `reviewStage` to `awaiting_manager` and keeps `status: 'ready'`.
  - Provide listing endpoint filtered by saved cards, supporting search by tags/date.
- Frontend
  - Add action to manager review UI with note input and confirmation.
  - Create saved-for-later view with sorting/filtering and `Move back to review`/`Shortlist now` controls.
- QA/Telemetry
  - Track `card_saved_for_later` and `card_reactivated` events.
  - Tests covering transition rules (no duplicates, ensuring card leaves main queue, reactivation restores correct state).
