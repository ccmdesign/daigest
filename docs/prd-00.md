# Product Requirements Document: AI Digest Scraper

## Overview
Build a Slack-triggered research assistant that converts shared article links into structured summaries, stores canonical records in Google Docs, and surfaces confidence scoring so editorial teams can triage what to read next. The initial delivery focuses on validating scraping quality via a local agent, then layering the Slack and Docs integrations.

## Problem Statement
Researchers and editors share dozens of links in Slack without a durable archive or clarity on data quality. Manual summarisation wastes time, and inconsistent metadata makes downstream analysis unreliable.

## Goals & Success Metrics
- Generate structured digests (markdown + JSON) for ≥90% of submitted links during MVP usability tests.
- Provide confidence scoring that reviewers rate as "useful" in ≥80% of test sessions.
- Deliver Slack responses and Google Doc updates within 2 minutes for 95th percentile workloads (≤5 links per request) post-integration.

## Target Users & Personas
- **Research Analyst**: Shares links, expects quick summaries to decide reading order.
- **Editor/Lead**: Reviews consolidated Google Doc to plan coverage and track gaps.
- **Ops/Platform Admin**: Maintains integrations, monitors failures, rotates credentials.

## User Stories (Prioritised)
1. As an analyst, I can run the scraper locally with a list of URLs and receive markdown/JSON outputs with confidence signals (MVP).
2. As an analyst, I can mention the Slack bot in-channel and receive a threaded summary with per-link confidence plus a link to the living Google Doc.
3. As an editor, I can open the Google Doc and see the latest run appended under a timestamped heading with all metadata fields populated or marked red when missing.
4. As an admin, I can view logs/alerts when scraping fails or confidence is red for more than 30% of links in a run.

## Scope
- **MVP (Phase 0)**: Local CLI agent, scraping pipeline, markdown/JSON/links artifacts, Playwright regression tests.
- **Phase 1**: Slack webhook, queue/worker orchestration, Google Docs updater, initial monitoring/logging.
- **Future**: Scheduling, dashboard, advanced ML summarisation, multi-destination routing.

## Functional Requirements
- Accept array of absolute URLs (HTTP/HTTPS); reject invalid inputs with actionable error.
- Scrape using provider chain (Playwright → Readability/MetaScraper → Trafilatura fallback → PDF parser) behind a pluggable interface.
- Support optional paid fallback (e.g., Diffbot) behind feature flag when budget allows.
- Produce confidence score with emoji, percentage, field provenance, and remediation notes for low scores.
- Persist outputs (`article_scraping_results.md`, `links.md`, `digest.json`) and expose run metadata (timestamp, counts, fallbacks used).
- For integrated phases: respond in Slack threads and update designated Google Doc sections idempotently.

## Non-Functional Requirements
- Respect provider rate limits; configurable retries, timeouts, and optional Diffbot quota guardrails.
- Secure credential handling via environment variables/secret manager.
- Observability hooks (structured logs, error tracking) ready by Phase 1.

## Dependencies & Integrations
- Slack Bot token + signing secret (Phase 1).
- Google Workspace service account with Docs API access (Phase 1).
- Scraper tooling: Playwright runtime, `@mozilla/readability`, `metascraper`, optional Trafilatura microservice, `pdf-parse`, optional paid fallback (Diffbot or similar).
- Storage for artifacts (local FS → S3/Spaces).

## Risks & Mitigations
- **Scraper blocks**: rotate user agents, leverage Trafilatura fallback, cache successful responses, allow manual overrides, optionally enable Diffbot for stubborn domains.
- **Credential leakage**: enforce secret management, rotate regularly.
- **Google Doc conflicts**: use transactional updates with section anchors; consider Sheets fallback.
- **Slack rate limits**: batch responses, use threaded replies.

## Open Questions
- Should we store historical digests beyond Google Docs (e.g., database)?
- Do we need human approval workflows for red confidence entries?
- What is the retention policy for raw scraped HTML/PDF content?
- Under what conditions would we enable paid fallbacks like Diffbot, and how do we monitor spend?
