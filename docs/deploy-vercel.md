# Deploying to Vercel

This setup runs the scraper inside a serverless function that returns JSON instead of writing artifacts to disk. Use it for manual or scheduled invocations (via Vercel Cron) before wiring downstream storage.

## 1. Install Playwright Dependencies

Because serverless functions have tight execution limits, choose whether to keep headless Playwright enabled:

- Default (`DISABLE_PLAYWRIGHT=1`): relies on the HTTP provider only. Works everywhere with lower fidelity.
- Enable Playwright only if the target host supports Chromium (e.g. Vercel with custom build steps or a self-hosted runtime).

Set the environment variable in the Vercel dashboard (`Project Settings → Environment Variables`). Unless you override it, Vercel will run the function on its default Node.js runtime (currently Node 22+), which is compatible with this codebase.

### Enabling Playwright on Vercel

1. Remove (or set to `0`) the `DISABLE_PLAYWRIGHT` env var.
2. Add `PLAYWRIGHT_SERVERLESS=1` so the scraper uses `@sparticuz/chromium-min` inside the serverless function.
3. If the project was deployed previously with Playwright disabled, redeploy after the env changes.

The bundled `@sparticuz/chromium-min` binary keeps the function size under the Vercel limits while allowing Playwright captures.

## 2. Configure the Function

`api/digest.js` exposes a `POST /api/digest` endpoint:

```json
{
  "urls": ["https://example.com/article", "https://example.com/another"]
}
```

You can also send a newline-delimited string in `urls`.

The function returns:

```json
{
  "metadata": {
    "startedAt": "2025-09-18T18:45:00.000Z",
    "durationMs": 17890,
    "total": 2
  },
  "records": [...]
}
```

Artifacts are not written to disk on serverless runs.

## 3. Deploy Steps

1. Install the Vercel CLI (`npm i -g vercel`).
2. Log in: `vercel login`.
3. From the repository root, run `vercel` and follow the prompts.
4. Subsequent updates use `vercel deploy`.

The provided `vercel.json` bumps memory to 1.5 GB and allows up to 60 s execution.

## 4. Scheduling (Optional)

Add a Vercel Cron job under **Project Settings → Cron Jobs** that triggers `/api/digest` on your desired cadence. If the job should run the same set of URLs each time, hard-code them in the cron request payload or host them in a small config service.

## 5. Persisting Results

Because serverless instances are ephemeral, route the JSON response into durable storage:

- Call `/api/digest` from a workflow (GitHub Actions, Zapier, etc.) and upload the response to S3, Supabase, or Google Drive.
- Or extend the function to push artifacts directly to your datastore (e.g. write to S3 or a database) before returning.

Once you move beyond ad-hoc triggers or need Playwright-enabled rendering, consider a container-based host (Fly.io, Render, Railway) where Chromium and file storage are fully under your control.
