# Scraper Quality Upgrade Plan (Open-Source First)

## Objective
Improve metadata completeness and confidence by composing a small number of open-source scraping components. The pipeline should run locally or on inexpensive infrastructure, handle HTML, dynamic pages, and PDFs, and avoid dependency on paid SaaS unless absolutely necessary.

## Core Extraction Stack
1. **Playwright Capture (Node)**
   - Launch headless Chromium with stealth headers.
   - Wait for network idle, then snapshot rendered HTML and plain text.
   - Works for dynamic sites, soft paywalls, and pages requiring minor JS execution.

2. **Readability + MetaScraper (Node)**
   - Feed rendered HTML into `@mozilla/readability` wrapped with `jsdom` to obtain title, byline, publication date, and article body.
   - Use `metascraper` rules to enrich missing metadata (site name, description, social tags).

3. **Trafilatura Microservice (Python, optional but recommended)**
   - Run as Docker service or CLI for robustness against messy markup.
   - Provides high-quality text extraction, language detection, and metadata; acts as fallback when Readability confidence < threshold or body too short.

4. **PDF Handling (Node)**
   - Use `pdf-parse` (built on `pdf.js`) to extract text and metadata.
   - Apply heuristic parsing (first page title, publication inference via URL/metadata).

This stack stays fully open-source and self-hostable while covering most article formats without third-party APIs.

## Diffbot Evaluation (Optional Fallback)
- **Capabilities**: Mature Article API returning structured metadata (title, author, publish date, tags, sentiment, etc.) and handles many anti-bot measures.
- **Free Tier Reality**: Typically offers a time-limited trial (≈1000 calls over 14 days). No long-term free quota is advertised post-trial; ongoing usage requires paid credits (~$0.002–$0.008 per call depending on volume).
- **Pros**: High accuracy, minimal integration effort (REST), handles tricky layouts, includes NLP extras.
- **Cons**: Paid after trial, requires credit card, rate-limited; storing raw pages on Diffbot’s side may raise compliance questions; introduces external dependency and latency (~1–2s per call).
- **Decision**: Keep Diffbot integration as an optional plugin behind `ENABLE_DIFFBOT` flag. Use only if budget approved; otherwise rely on open-source stack plus proxy rotation. Re-evaluate after MVP if accuracy gaps persist.

## Orchestration Model
- Define a `ScraperProvider` interface with `supports(url)`, `execute(request)`, `confidence`, `cost`, `notes`.
- Routing rules:
  1. `.pdf` → PDF provider.
  2. HTML → Playwright capture → Readability.
  3. If Readability output is incomplete (missing title/summary/body < 200 words) → invoke Trafilatura fallback.
  4. If Playwright or Readability fails because of anti-bot controls → optionally retry via proxy. Diffbot may be invoked as last resort when enabled and quota available.
- Merge fields from providers prioritising higher-confidence sources while recording provenance.

## Metadata Enrichment
- Normalise publication name using URL hostname + curated overrides list (`config/publications.json`).
- Extract tags via `<meta keywords>` and simple TF-IDF keywords from body text (e.g., `keyword-extractor` library); if Diffbot used, prefer its tags.
- Estimate word count from cleaned body tokens.
- Identify language using `franc` or `langdetect` to flag non-English content.

## Confidence Scoring Enhancements
- Base score on presence of key fields (title, description, author, publish date, body length).
- Boost score when multiple providers agree on the same field.
- Reduce score for:
  - HTTP errors / heavy retries
  - Empty body or low word count
  - Language mismatch with expected locale
  - Provider fallback exhaustion without success
- Output actionable notes ("Requires login", "Blocked by robots.txt", "PDF text extraction ambiguous", "External service disabled").

## Local MVP Upgrade Plan
1. Introduce provider abstraction layer and integrate Playwright + Readability as the default path.
2. Add PDF provider powered by `pdf-parse` with metadata heuristics.
3. Package Trafilatura microservice (Docker compose + Node client) with toggle to disable.
4. Create optional Diffbot adapter stubbed behind feature flag, only invoking when credentials/quota configured.
5. Update CLI to accept `--no-browser` (skip Playwright) and `--providers providers.json` for custom ordering.
6. Extend JSON artifact to include `provenance` map per field (`{ title: "readability", author: "trafilatura" }`).
7. Add regression fixtures (HTML, JS-heavy, PDF, blocked site) to Playwright tests verifying merged output and confidence adjustments.

## Operational Considerations
- **Performance**: Cache rendered HTML to avoid repeated Playwright launches during QA.
- **Resource usage**: Allow running without Playwright in CI by toggling to static fetch + Readability for deterministic tests.
- **Configuration**: Centralise settings in `config/providers.json` (timeouts, retries, user agents, proxy URL, enableTrafilatura, enableDiffbot).
- **Logging**: Emit structured logs (`scraper`, `provider`, `attempt`, `status`, `durationMs`, `notes`) to ease debugging.

## Optional Pro Add-Ons (Future)
- Lightweight proxy rotation via open-source solutions (e.g., `scrapoxy`, self-hosted rotating proxies).
- Named entity recognition (spaCy) for enriched tags.
- Summarisation using open-source models (e.g., `bark-summarizer`, `pegasus` via HuggingFace) run locally with GPU/accelerated inference.

## Open Questions
- Is a Python dependency acceptable for Trafilatura, or should we replicate similar behaviour in Node only?
- Do we need multi-language support at launch, or can we defer advanced language processing?
- Should we persist rendered HTML/PDF text in storage for audit trails, or only the derived metadata?
- Under what conditions would we fund Diffbot usage, and who approves that spend?
