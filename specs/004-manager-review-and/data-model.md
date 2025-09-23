# Data Model: Manager Review and Curation

This feature focuses on changing the `reviewStage` of the `Card` entity to reflect the Manager's decisions.

## Card
- **Description**: The state of the `Card` entity is changed by this feature.
- **Attribute Updated**:
  - `reviewStage`: string - This is changed to one of `shortlisted`, `saved_for_later`, or `needs_revision`.

## Issue
- **Description**: Represents an upcoming newsletter issue. Shortlisted cards are associated with an issue.
- **Attributes**:
  - `id`: string
  - `name`: string (e.g., "Newsletter Vol. 5")
  - `publish_date`: date

## Backlog
- **Description**: A collection of cards that have been saved for later.
