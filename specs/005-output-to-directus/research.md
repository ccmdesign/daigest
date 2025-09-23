# Research: Output to Directus

## Directus API
- **Authentication**: The Directus API uses token-based authentication. A static token can be generated for the server to use. This token must be stored securely as an environment variable.
- **SDK vs. HTTP Client**: Directus provides a JavaScript SDK which can simplify interactions. Alternatively, a standard HTTP client like `ofetch` (built into Nuxt) can be used to make REST API calls.
  - **Decision**: Use the official Directus SDK (`@directus/sdk`) to benefit from typed methods and simplified API interactions.
- **Create/Update Logic**: To handle both creating and updating entries, the application will first need to check if a card has a `directus_id`. If it does, it will use a `PATCH` request to update the existing item. If not, it will use a `POST` request to create a new item.

## Error Handling
- **Rate Limits**: The Directus API may have rate limits. The `DirectusService` should implement a retry mechanism with exponential backoff for rate-limit errors (HTTP 429).
- **Network Errors**: The service should also handle network errors and other transient failures gracefully.
