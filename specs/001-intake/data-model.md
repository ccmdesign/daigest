# Data Model: Intake

## Entities

### URL
- **Description**: Represents a single web address submitted by an Analyst for processing.
- **Attributes**:
  - `value`: string (The URL itself)

### Card
- **Description**: The resulting object created by the Processing module from a submitted URL. The Intake module's primary output is the trigger to create a Card. The card itself is managed by the Processing module.
- **Attributes**:
  - `id`: string (Unique identifier)
  - `sourceUrl`: string (The original URL submitted)
  - `title`: string
  - `summary`: string
  - `status`: string (`queued`, `processing`, `ready`, `error`)
  - `reviewStage`: string (`analyst_review`, `awaiting_manager`, etc.)
  - ... and other metadata.

## Relationships
- A `URL` submitted through the intake process results in the creation of one `Card`.
