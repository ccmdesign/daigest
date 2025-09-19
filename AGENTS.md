# Repository Guidelines

## Project Structure & Module Organization
- `mcp-config.json` defines available MCP servers and expected API keys; keep it authoritative for runtime configuration.
- Reference outputs such as `article_scraping_results.md` and `links.md` summarize crawled content; regenerate them rather than editing by hand.
- Dependency code lives under `node_modules/`; do not edit it directly—place any repository-owned scripts in a new `scripts/` directory if needed.

## Build, Test, and Development Commands
- `npm install` — install MCP connectors and Playwright locally; run whenever package versions change.
- `npx playwright test` — execute Playwright-based regression checks; add `--reporter=list` for quick console feedback.
- `npm run intake:slack` — start the local Slack link intake server (requires `SLACK_SIGNING_SECRET`).
- `npm run queue:drain` — process any queued links through the scraper pipeline.
- `npx @apify/actors-mcp-server --help` and similar MCP CLIs — verify connectivity or debug agent behavior before shipping changes.
- See `docs/deploy-vercel.md` for serverless deployment instructions.

## Coding Style & Naming Conventions
- Target Node.js 18+ syntax; prefer modern ES modules and async/await.
- Use two-space indentation, single quotes for strings, and descriptive camelCase identifiers (`fetchDigestLinks`, not `get_links`).
- Commit generated markdown (scrape digests, link inventories) with clear headers so downstream agents can parse them deterministically.

## Testing Guidelines
- Organize Playwright tests under `tests/` (create the folder if absent) and mirror the scenario name in the filename (`digest.spec.ts`).
- Exercise any new agent workflow with at least one happy-path test and, when feasible, a failure-path assertion for empty results.
- When a change depends on external APIs, stub API responses or guard the test with environment checks to avoid noisy failures.

## Commit & Pull Request Guidelines
- Follow a Conventional Commits style (`feat:`, `fix:`, `chore:`) to signal agent-impacting changes in automation logs.
- Describe why the change matters, note required environment variables, and include before/after snippets or logs in the PR body.
- Link relevant tracking issues and paste Playwright output (or state "tests not run" with justification) before requesting review.

## Security & Configuration Tips
- Replace sample keys in `mcp-config.json` with secrets stored via your preferred manager, then load them at runtime through environment variables.
- Audit configs for unneeded providers before pushing to avoid exposing dormant credentials.
