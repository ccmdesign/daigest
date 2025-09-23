# Data Model: Analyst Card Submission

This feature does not introduce new entities. It primarily concerns itself with updating the `reviewStage` attribute of the existing `Card` entity.

## Card
- **Description**: The state of the `Card` entity is changed by this feature.
- **Attribute Updated**:
  - `reviewStage`: string - This is changed from `analyst_review` to `awaiting_manager`.
