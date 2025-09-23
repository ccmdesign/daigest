# Project Overview

**Objective:** build an end-to-end system where teammates drop story links into Slack, the pipeline scrapes and enriches the articles, and the finished digest lands in Google Docs for editorial review and downstream reuse.

High-level flow:
1. **Submit** – analyst uses a Slack slash command (or direct webhook) to queue URLs.
2. **Scrape & Enrich** – the pipeline (Playwright + Readability + fallbacks) renders pages, extracts metadata, scores confidence, and records provenance.
3. **Deliver** – results are compiled into reviewer-friendly markdown, machine-readable JSON, and ultimately a structured Google Doc ready for publishing/hand-off.

This repo contains steps 2 and the scaffolding for 1. The final Google Docs export (step 3) is on the roadmap and will reuse the JSON digest emitted here. The implementation emphasises open-source components, self-hostability, and clear provenance so auditors can trace every field back to its source provider.

---

## 1. Architecture Snapshot

| Layer | Key Modules | Notes |
| --- | --- | --- |
| **CLI & APIs** | `src/cli/run.js`, `src/cli/drainQueue.js`, `api/digest.js` | Local CLI writes artifacts; Netlify/Vercel endpoint returns JSON only. Both load env vars via `src/utils/loadEnv.js`.
| **Providers** | `src/pipeline/providers/` | Ordered pipeline: Playwright → HTTP → Readability/Metascraper → Trafilatura → Diffbot (stub). Providers add provenance info to `ScraperContext`.
| **Fetchers** | `src/pipeline/fetchers/basicFetcher.js`, `playwrightRenderer.js` | HTTP fetch with AbortController; Playwright supports serverless Chromium when `PLAYWRIGHT_SERVERLESS=1`.
| **Parsers** | `src/pipeline/parsers/htmlParser.js`, Readability adapter | Normalises metadata, extracts language/keywords, merges fallbacks.
| **Confidence / Rendering** | `src/pipeline/confidence/scoring.js`, `renderers/markdown.js` | Score based on field completeness, provenance; reviewer markdown shows metadata, provenance, body preview.
| **Outputs** | `src/outputs/writer.js` | Writes markdown, links list, JSON locally when `writeArtifacts!==false`.
| **Queueing** | `src/intake/linkQueue.js`, `docs/slack-intake.md` | Simple JSON-backed queue for Slack slash command intake (`npm run intake:slack`).

Persistent artifacts (when running locally):
- `article_scraping_results.md`
- `links.md`
- `digest.json`
- Slack queue at `data/linkQueue.json` (ignored by Git).

---

## 2. Current Capabilities

### What’s working today

- **Metadata-rich scraping** – Playwright-rendered HTML with Readability+Metascraper enhancements, PDF parsing, optional Trafilatura/Diffbot hooks.
- **Confidence scoring** – Field-aware scoring with provenance and notes; redacts low-confidence records.
- **Reviewer-friendly digest** – Markdown layout (`# Digest Review`) summarises run and per-article metadata.
- **Serverless API (Vercel)** – `POST /api/digest` returns the JSON digest; Playwright can be enabled via `PLAYWRIGHT_SERVERLESS=1`. Works for ad-hoc requests but still being stabilised.
- **Environment handling** – Secrets loaded from `.env` (copy `.env.example`), `mcp-config.json` reads keys from env placeholders.
- **Tests** – Playwright tests verify markdown layout and JSON shape (`tests/digest.spec.ts`).

### What’s still outstanding

- **Slack integration not production ready** – slash-command server is implemented but not configured with Slack yet (no tunnel/host or slash command). Currently queues links via HTTP only.
- **Deployment under evaluation** – Vercel deploy works for simple runs but may not be final (Chromium cold starts, runtime limits). We’re open to DigitalOcean, Render, Fly, or other hosts if they suit the team better.
- **Google Docs export** – not implemented. JSON digest is ready, but no downstream Docs integration yet.

See Section 4 (Backlog) for the detailed roadmap.

---

## 3. Deployment Footprint

- **Local dev:** `npm run scrape -- --input links.txt` or pass URLs directly. Requires Node 18+, Playwright deps (`npx playwright install-deps` on Linux if needed).
- **Serverless (Vercel):**
  - Env vars: `DISABLE_PLAYWRIGHT` (set to `0` to enable), `PLAYWRIGHT_SERVERLESS=1`, plus API keys.
  - `vercel.json` bumps memory (1536 MB) and timeout (60s); see `docs/deploy-vercel.md`.
- **Secrets:** store in `.env` locally and Vercel project settings. `.env` is Git ignored; sample values in `.env.example`.

---

## 4. Backlog & Next Steps

1. **Integration workflow:**
   - Automate storage of serverless results (S3, Supabase, GDrive) instead of manual download.
   - Wire Slack queue → serverless endpoint (or persistent queue) for continuous ingestion.
2. **Testing / QA:**
   - Add fixtures for Playwright vs HTTP fallback, PDF, blocked sites.
   - Unit-test provider ordering and provenance merging.
3. **Google Docs exporter:**
   - Transform digest JSON into Docs using Google API / Apps Script; capture provenance in doc.
4. **Trafilatura integration:**
   - Host microservice or docker sidecar; update provider config to enable when endpoint available.
5. **Observability:**
   - Structured logging sink (CloudWatch/Datadog) for serverless runs.
   - Alerting when confidence drops or providers fail repeatedly.
6. **Authentication & security hardening:**
   - Remove sample secrets from history; rotate keys where necessary.
   - Add vault integration (1Password, Vault, doppler) for multi-environment secrets.
7. **Performance & caching:**
   - Cache rendered HTML (S3/Redis) to avoid re-scraping the same URLs.
   - Implement concurrency controls / request throttling for large batches.
8. **CI/CD:**
   - Set up GitHub Actions for lint + tests + deploy preview (currently manual). 

---

## 5. Known Issues / Caveats

- **Playwright on Vercel:** `@sparticuz/chromium-min` works, but cold starts can approach runtime limit on heavy pages. Monitor execution time.
- **Trafilatura/Diffbot disabled:** Config includes stubs; enable only when endpoints/tokens are configured.
- **Slack server** currently writes queue to `data/linkQueue.json`. For multi-host deployments, move to shared storage (Redis, Dynamo, etc.).
- **Artifact generation suppressed serverless:** API returns JSON only. If you need markdown in serverless context, render inside the handler and return alongside JSON.
- **Provider args:** `scrappey` path is workspace-specific; confirm Node path when deploying elsewhere.

---

## 6. Onboarding Checklist for New Dev

1. Clone repo, run `npm install`, copy `.env.example` to `.env`, fill secrets (ask project owner).
2. Run `npm run scrape -- https://example.com/article` to verify local pipeline.
3. (Optional) Start Slack intake: `SLACK_SIGNING_SECRET=... npm run intake:slack`, configure slash command, enqueue test link, `npm run queue:drain`.
4. Deploy changes via Git → Vercel (ensure env vars updated).
5. Review backlog above, prioritise next features with PM/owner.

---

## 7. Useful References

- `docs/slack-intake.md` – slash command setup and queue behaviour.
- `docs/deploy-vercel.md` – serverless deployment instructions, enabling Playwright.
- `article_scraping_results.md`, `digest.json` – sample run artifacts (regenerate as needed).
- `tests/digest.spec.ts` – Playwright test coverage.

---

*Last updated: 2025-09-18*
