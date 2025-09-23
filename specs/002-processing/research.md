# Research: Processing Module

## Optimistic UI Updates
When an Analyst saves an edit to a card, the UI should update immediately without waiting for the API response. If the API call fails, the UI should revert the change and show an error message. This provides a faster perceived performance.

- **Strategy**: Use a state management solution (like Pinia, or a simple Vue `ref`) to hold the card's state. When the user clicks save, update the local state immediately and send the API request. If the request fails, revert the local state to its previous value.

## Conflict Handling
If a card's data on the server changes while an Analyst is editing it (e.g., due to a rescan), a conflict can occur.

- **Strategy**: Include a version number or a timestamp in the card data. When submitting an edit, send the version number the user started editing from. The server can then check if the card has been updated since that version. If it has, the server should reject the edit and the UI should prompt the user to review the new data and re-apply their changes.

## Diff Viewer
To show the difference between the original and edited content, a diffing library can be used.

- **Library**: `diff-match-patch` or a similar library can be used to generate a visual diff of the text changes.
