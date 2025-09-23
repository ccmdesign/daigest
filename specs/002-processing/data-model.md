# Data Model: Processing

## Entities

### ArticleRecord
- **Description**: The central entity for this module. It represents a single processed URL and all its associated data and metadata.
- **Attributes**:
  - `id`: string (Unique identifier)
  - `url`: string (The source URL)
  - `status`: string (`queued`, `processing`, `ready`, `error`)
  - `reviewStage`: string (`analyst_review`, `awaiting_manager`, `needs_revision`, `shortlisted`, `saved_for_later`)
  - `title`: string
  - `description`: string
  - `author`: string
  - `publisher`: string
  - `published_on`: string
  - `body`: string
  - `notes`: string[]
  - `edits`: object (Contains the edited fields)
  - `editMetadata`: object (Contains information about the edits, like `editedBy`, `editedAt`, `version`)
  - `original`: object (Contains the original, unedited scraped data)

### Edit History
- **Description**: An audit log of all changes made to an `ArticleRecord`.
- **Attributes**:
  - `id`: string
  - `article_id`: string (Foreign key to `ArticleRecord`)
  - `editor_id`: string
  - `timestamp`: datetime
  - `changes`: object (A diff of the changes made in this edit)
