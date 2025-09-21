#!/usr/bin/env node
require('../utils/loadEnv');
const express = require('express');
const crypto = require('crypto');
const http = require('http');
const { enqueueLink } = require('./linkQueue');
const { logInfo, logWarn, logError } = require('../utils/logger');

const DEFAULT_PORT = 8787;

function createApp({ signingSecret }) {
  const app = express();

  app.use(
    express.urlencoded({
      extended: true,
      verify: (req, res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );

  app.get('/healthz', (req, res) => {
    res.json({ ok: true });
  });

  app.post('/slack/links', (req, res) => {
    if (!signingSecret) {
      logWarn('Slack signing secret not configured; rejecting request');
      res.status(500).send('Slack integration not configured');
      return;
    }

    if (!verifySlackRequest({ req, signingSecret })) {
      res.status(401).send('Invalid signature');
      return;
    }

    const payload = req.body || {};
    const url = extractUrl(payload.text);
    if (!url) {
      res.send('No URL detected in command. Provide a link after the slash command.');
      return;
    }

    const result = enqueueLink({
      url,
      submittedBy: payload.user_name || payload.user_id,
      channelId: payload.channel_id,
      channelName: payload.channel_name,
      originalText: payload.text,
      source: 'slack',
    });

    if (!result.added && result.reason === 'duplicate') {
      res.send(`Already queued: ${url}`);
      return;
    }

    if (!result.added && result.reason === 'invalid_url') {
      res.send('Could not parse a valid URL. Please double check the format.');
      return;
    }

    const queueLength = result.queueLength || 0;
    res.send(`Queued ${url} (pending: ${queueLength}).`);
  });

  app.use((err, req, res, next) => {
    logError('Slack intake error', { error: err.message });
    res.status(500).send('Internal error');
    next();
  });

  return app;
}

function verifySlackRequest({ req, signingSecret }) {
  try {
    const timestamp = req.headers['x-slack-request-timestamp'];
    const slackSignature = req.headers['x-slack-signature'];
    if (!timestamp || !slackSignature) {
      return false;
    }

    const fiveMinutes = 60 * 5;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - Number(timestamp)) > fiveMinutes) {
      logWarn('Slack request timestamp outside tolerance');
      return false;
    }

    const baseString = `v0:${timestamp}:${req.rawBody || ''}`;
    const signature = `v0=${crypto.createHmac('sha256', signingSecret).update(baseString).digest('hex')}`;
    const valid = crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(slackSignature, 'utf8'));
    if (!valid) {
      logWarn('Slack signature mismatch');
    }
    return valid;
  } catch (error) {
    logWarn('Slack verification failed', { error: error.message });
    return false;
  }
}

function extractUrl(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/https?:\/\/\S+/i);
  if (!match) return null;
  const candidate = match[0].replace(/[)>"']*$/, '');
  return candidate;
}

function startServer() {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const port = Number(process.env.SLACK_PORT) || DEFAULT_PORT;
  const app = createApp({ signingSecret });
  const server = http.createServer(app);
  server.listen(port, () => {
    logInfo('Slack intake listening', { port });
    if (!signingSecret) {
      logWarn('SLACK_SIGNING_SECRET not set. Requests will be rejected.');
    }
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, extractUrl, verifySlackRequest };
