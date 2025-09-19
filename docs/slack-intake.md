# Slack Link Intake

This lightweight service lets teammates drop URLs into Slack and queue them for the digest scraper. It is designed for the current load (~50 links/week) and stores pending links on disk so the existing CLI can pull them into the pipeline.

## 1. Create the Slack App

1. Visit https://api.slack.com/apps and create a new app (e.g. `ai-digest-intake`).
2. Under **Slash Commands**, add a command such as `/digest`. Use the following settings:
   - **Request URL**: `https://<your-host>/slack/links`
   - **Short Description**: `Queue an article link for the AI digest`
3. Install the app to your workspace to obtain the **Signing Secret**.

Only the signing secret is required for now—the server does not post back to Slack via the Web API.

## 2. Run the Intake Server

```
SLACK_SIGNING_SECRET=xxxxxxxx npm run intake:slack
```

Environment variables:

- `SLACK_SIGNING_SECRET` (required): validates incoming requests.
- `SLACK_PORT` (optional): defaults to `8787`.

The server exposes:

- `POST /slack/links` — Slash command endpoint.
- `GET /healthz` — Basic health check for probes.

Requests failing signature validation are rejected with `401`.

## 3. Queue Behaviour

- Incoming links are normalised (scheme, hostname, no trailing slash) and stored in `data/linkQueue.json`.
- Duplicates already in the pending queue are ignored.
- Metadata captured per link: user name/id, channel, original slash command text, source (`slack`), timestamp.

## 4. Processing the Queue

To run the scraper against all pending links:

```
npm run queue:drain
```

Options:

- `--limit <n>` / `-n <n>` — process only the first _n_ queued links.

On failure, drained links are re-queued automatically.

## 5. Operational Notes

- The intake server is stateless apart from the on-disk queue; run it behind a tunnel (ngrok/Cloud Run/etc.) while prototyping.
- Back up `data/linkQueue.json` or redirect to persistent storage before deploying to shared infrastructure.
- Extend later with Slack message shortcuts or reactions by adding Event API handlers on the same server.
