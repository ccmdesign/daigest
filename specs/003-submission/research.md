# Research: Analyst Card Submission

## UI State Management
Upon successful submission of a card, the UI needs to be updated to reflect this change. The submitted card should be removed from the Analyst's list of cards to review.

- **Strategy**: The parent component that manages the list of cards should be responsible for this. When the `EditableCard.vue` component emits a `submitted` event, the parent component will catch this event and filter the submitted card out of its local array of cards. This avoids a full page reload and provides a smooth user experience.
