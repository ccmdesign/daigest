# Data Model: Output to Directus

This document outlines the mapping between the application's `Card` entity and the target Directus collection.

## Card to Directus Mapping

| Card Field        | Directus Field    | Notes                               |
| ----------------- | ----------------- | ----------------------------------- |
| `title`           | `title`           |                                     |
| `summary`         | `summary`         |                                     |
| `author`          | `author`          |                                     |
| `sourceUrl`       | `source_url`      |                                     |
| `published_on`    | `publish_date`    |                                     |
| `reviewStage`     | `status`          | e.g., 'shortlisted' -> 'published'  |

## Card Entity Update

The `Card` entity in the local database will be updated to include fields for tracking the Directus sync status.

- **New Attributes**:
  - `directus_id`: string (The ID of the corresponding entry in Directus)
  - `sync_status`: string (`not_exported`, `pending`, `synced`, `error`)
  - `last_sync_at`: datetime
