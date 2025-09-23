# Research: Manager Review and Curation

## Dashboard Design
- **Component Library**: ShadCN Vue provides the necessary components (Tables, Badges, Buttons) to build a clean and effective dashboard for the manager.
- **Filtering**: Client-side filtering can be implemented using Vue computed properties for a fast and responsive user experience. For larger datasets, server-side filtering will be necessary, so the API design should account for filter parameters.

## Feedback Mechanism
When a Manager returns a card to an Analyst, there needs to be a clear way to communicate the reason.

- **Strategy**: A simple textarea can be used for the Manager to enter feedback notes. These notes will be stored with the card's history and displayed to the Analyst when they re-open the card.
