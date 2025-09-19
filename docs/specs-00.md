# Project Specification: AI Digest Scraper

## Product Goal
Deliver a service that transforms shared article links into trustworthy research digests. End users drop URLs into a designated Slack channel or mention the bot, and the system replies with a clean summary while updating a canonical Google Doc for long-term reference.

## Target User Flow
1. User pastes one or more links in Slack (channel or thread) and @mentions the bot or triggers a slash command.
2. Slack app forwards the payload (user, message, URLs, channel) to the backend webhook.
3. Backend validates the request, enqueues a job, and acknowledges in Slack ("Processing…").
4. Worker scrapes each link, assembles metadata, and writes outputs:
   - Short Slack reply with key takeaways and confidence signal per link.
   - Append/replace sections inside a Google Doc using the Docs API.
5. Worker posts a completion update in Slack once the Google Doc is refreshed.

## Deployment Options
- **Local CLI** for development or manual reruns.
- **Serverless function** (Vercel/Netlify) for the Slack webhook; offload heavy scraping to a queue-backed worker (e.g., AWS Lambda, DO Functions, Fly.io app).
- **Dockerised worker** on a small DigitalOcean droplet handling scraping, Google Docs updates, and queue consumption.

## Inputs & Outputs
- **Input payload**: `{ requestId, channelId, userId, links: string[], context?: string }`.
- **Slack output**: ephemeral "processing" message + summary message with per-link confidence.
- **Artifacts**:
  - `article_scraping_results.md`
  - `links.md`
  - `digest.json`
  - Google Doc section per run (e.g., heading with timestamp and channel).

## Workflow Pipeline
1. **Normalise Requests**: deduplicate URLs, expand redirects, confirm protocol.
2. **Scrape & Parse**: Firecrawl → Playwright → Brightdata → PDF Reader; allow plugging alternative scrapers.
3. **Enrich & Score**: derive author, publication, publish date, summary, tags, and assign confidence tiers (green ≥80%, yellow 40–79%, red <40%). Record tooling used.
4. **Persist & Publish**:
   - Render markdown + JSON locally (or to object storage).
   - Update Google Doc via batch update (service account credential).
   - Post Slack follow-up with highlights (title, summary sentence, confidence emoji, link to doc section).

## Data Contract
For each link record:
- `title`
- `description`
- `url`
- `author`
- `published_on`
- `publication_date`
- `confidence` (emoji, percentage, reason, tool)
- Optional: `word_count`, `tags`, `notes`, `source_message_permalink`

Red confidence entries include only `url`, `confidence`, and a short reason.

## Edge Case Handling
- **Blocked site**: escalate to Playwright with realistic headers; fallback to Brightdata; if still blocked mark red and explain.
- **PDF source**: use PDF Reader; if unreadable, note manual follow-up.
- **Paywall/login**: do not bypass; return red with paywall notice.
- **Duplicated links**: aggregate but note all origins in Slack reply and `links.md`.
- **Non-article content**: reject with red confidence and describe issue.

## Architecture Components
- `webhook` service (Serverless/Express) validates Slack signing secret, parses URLs, and enqueues jobs.
- `worker` service handles scraping pipeline, artifact generation, Google Docs sync, and final Slack reply.
- `storage` options: local filesystem during dev, S3/Spaces bucket in production.
- `Google Docs adapter` that manages section templates (e.g., Heading 2 per run, bullet list per article) and idempotent updates.
- `Slack adapter` for ephemeral messages, updates, and threaded replies.

## Implementation Guidance
- Organise code under `src/` modules: `adapters/slack`, `adapters/google-docs`, `pipeline/fetchers`, `pipeline/parsers`, `pipeline/confidence`, `pipeline/renderers`.
- Use a provider interface so scrapers can be swapped without core changes.
- Store configuration in `config/*.ts` or `.json` (timeouts, retry counts, provider priority, Google Doc ID).
- Emit structured logs (JSON) and trace IDs to correlate Slack message ↔ job ↔ Google Doc sections.

## Testing & Quality
- **Unit tests** for parsing helpers, confidence scoring, Google Docs diffing, Slack formatting.
- **Integration tests** using recorded HTML/PDF fixtures and mocked APIs for Slack/Google.
- **End-to-end smoke**: local script simulating Slack event triggers full pipeline and verifies Google Doc update (via test doc).
- CI pipeline: `npm test`, `npx playwright test` (artifact regression), linting (ESLint/Prettier, two-space indentation, single quotes).

## Security & Compliance
- Manage Slack bot tokens, signing secret, and Google service-account JSON via secret manager or environment variables; never commit keys.
- Enforce Slack request verification (timestamp + signature) before queueing jobs.
- Restrict Google Doc permissions to service account and intended editors; log write operations.
- Respect robots, rate limits, and terms of service for all scraping providers.

## Future Enhancements
- Add scheduling/recurring digest aggregation (e.g., daily summary doc sections).
- Support multi-channel routing to different Docs or Sheets.
- Integrate optional summarisation models for richer Slack updates.
- Provide an internal dashboard for monitoring confidence trends and scrape failures.
