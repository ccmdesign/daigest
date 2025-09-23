# Editable Digest Cards – Specification

## 1. Overview
- **Goal:** Allow reviewers to make lightweight edits to scraped article data directly inside the Nuxt UI while keeping the original crawl results available for auditing.
- **Primary Users:** Content reviewers curating digests; operations engineers verifying pipeline accuracy.
- **Motivation:** Reviewers often need to correct titles, fix summaries, or add clarifying notes before exporting/sharing a digest. Today they must copy results into another tool, creating version drift and manual effort.

## 2. Scope
### In Scope
- Per-card edit mode using inline `contenteditable` regions for text fields (title, description, author, publisher, notes).
- Persisting edited values alongside originals so exports and share links respect reviewer changes.
- Server-side storage layer that can retain edited digests (initial target: SQLite or Supabase; fallback JSON for local dev).
- Change-tracking metadata (who edited, when, which fields) for audit + downstream automation.
- UI affordances for saving, cancelling, and viewing “edited vs. scraped” deltas.

### Out of Scope (Phase 1)
- Multi-user real-time collaboration or conflict resolution.
- WYSIWYG formatting beyond basic plaintext.
- Editing of pipeline-only fields (confidence score, provenance, providersUsed).
- Full permissions/authentication model (spec assumes trust in existing reviewers).

## 3. UX Requirements
- Cards remain read-only by default. “Edit card” button toggles editable state for supported fields.
- While editing, show subtle highlight around editable areas and provide “Save” + “Cancel” CTAs in-card. Disable other bulk actions until save/cancel resolves.
- After save, card returns to read-only state and surfaces “Edited · timestamp · reviewer name/initials.”
- Provide a collapsible “Original scrape” drawer that reveals raw scraped values for comparison.
- Exports (JSON/Markdown/share link) must include edited content and note when fields differ from the scrape.
- If save fails, display inline error toast and keep edits in-place.

## 4. Data Model Changes
Augment existing `ArticleRecord` shape to support persisted edits while keeping backwards compatibility.

```ts
type ArticleRecord = {
  // existing fields
  url: string
  title: string
  description: string
  author: string
  publisher: string
  published_on: string
  publication_date: string
  body: string
  notes: string[]
  // …

  // new fields
  edits?: {
    title?: string
    description?: string
    author?: string
    publisher?: string
    notes?: string
  }
  editMetadata?: {
    editedBy: string
    editedAt: string
    version: number
    diffKeys: string[]
  }
  original?: {
    title?: string
    description?: string
    author?: string
    publisher?: string
    notes?: string[]
  }
}
```

Persistence layer stores both the scraped baseline (under `original`) and reviewer overrides (`edits`). Display logic prefers `edits` when present.

## 5. Storage & Infrastructure
- Introduce an abstraction `EditableDigestStore` building on current JSON store.
- Recommended default: SQLite via Prisma or Drizzle for minimal ops overhead.
- For local sandboxing, reuse JSON file store but include new properties.
- Schema outline (relational version):
  - `digests` table: id, created_at, summary JSON, metadata JSON.
  - `articles` table: id, digest_id, scraped JSON, edits JSON, edit_metadata JSON.
- Migration path: first migrate existing JSON digests into `original` field when loaded; write new structure on save.

## 6. API Surface
### New/Updated Endpoints
- `POST /api/digest/:id/article/:articleId/edit`
  - Body: `{ edits: Partial<EditableFields>, editor: string }`
  - Validates editable keys, writes to storage, returns updated record.
- `GET /api/digest/:id` (existing)
  - Extended response to include `original`, `edits`, `editMetadata`.
- `POST /api/digest` (existing)
  - Accepts optional `edits` payload when saving results from UI.

### Validation & Business Rules
- Reject edits when digest id or article id not found.
- Enforce max length limits (e.g., title ≤ 200 chars, description ≤ 2k).
- Normalize whitespace and strip disallowed tags even though `contenteditable` is plaintext.
- Require `editor` identifier (future auth hook).

## 7. Frontend Implementation Plan
1. **State management:** Extend `useDigestProcessor` or create `useEditableRecord` composable to keep track of current edits and optimistic updates.
2. **Card UI:**
   - Add “Edit / Save / Cancel” actions.
   - Wrap editable regions in components using `contenteditable` with a controlled model + sanitize on blur.
   - Show diff badge when edited (`DiffChip` component).
3. **Persistence workflow:**
   - On save, call new API, update local state with server response, handle errors gracefully.
   - Update exports to reference `record.edits ?? record` values.
4. **Original vs. edited view:**
   - Add collapsible drawer to show `original` fields.
   - Provide quick “Revert to scraped value” action per field.

## 8. Security & Compliance
- Strip HTML/JS from `contenteditable` payloads server-side.
- Limit edit size to prevent giant payload uploads.
- Log edit events (digest id, article id, editor, timestamp, diff) for audit trail.
- Future: integrate with auth to map editor id to user.

## 9. Testing Strategy
- **Unit tests:**
  - Validate server handler rejects invalid edits and persists valid ones.
  - Sanitization helper removes unsafe markup.
- **Component tests (Vitest + Vue Test Utils):** ensure edit mode toggles, save/cancel interactions behave.
- **Playwright scenarios:**
  - End-to-end happy path: edit title, save, refresh, confirm persistence.
  - Failure path: simulate server error, verify toast + no data loss.
- **Migration tests:** confirm existing digests load with `original` populated and no edits.

## 10. Rollout Plan
1. Ship backend store + API changes behind feature flag (`NUXT_ENABLE_CARD_EDITS`).
2. Release UI with flag-controlled visibility.
3. Capture reviewer feedback; monitor storage growth + error logs.
4. Gradually enforce auth requirement once identity provider is ready.

## 11. Open Questions
- Do we need version history beyond last edit (i.e., full revision log)?
- Should edits be per-field or entire record snapshot? (Current design favors per-field.)
- How do exports denote edited fields—inline annotation or metadata block?

---
*Drafted by Codex – 2025-02-14*
