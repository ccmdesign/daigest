const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logInfo, logWarn } = require('../utils/logger');

const QUEUE_DIR = path.join(process.cwd(), 'data');
const QUEUE_PATH = path.join(QUEUE_DIR, 'linkQueue.json');

function ensureQueueFile() {
  if (!fs.existsSync(QUEUE_DIR)) {
    fs.mkdirSync(QUEUE_DIR, { recursive: true });
  }
  if (!fs.existsSync(QUEUE_PATH)) {
    const initial = { pending: [] };
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function loadQueue() {
  ensureQueueFile();
  const raw = fs.readFileSync(QUEUE_PATH, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.pending || !Array.isArray(parsed.pending)) {
      return { pending: [] };
    }
    return parsed;
  } catch (error) {
    logWarn('Failed to parse link queue; resetting', { error: error.message });
    return { pending: [] };
  }
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
}

function normaliseUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!parsed.protocol.startsWith('http')) return null;
    parsed.hash = '';
    const normalised = parsed.toString();
    return normalised.endsWith('/') ? normalised.slice(0, -1) : normalised;
  } catch (error) {
    return null;
  }
}

function hasDuplicate(queue, normalisedUrl) {
  return queue.pending.some((entry) => entry.normalisedUrl === normalisedUrl);
}

function createEntry({ url, submittedBy, channelId, channelName, originalText, source = 'slack' }) {
  return {
    id: crypto.randomUUID(),
    url,
    normalisedUrl: normaliseUrl(url),
    submittedBy,
    channelId,
    channelName,
    originalText,
    source,
    receivedAt: new Date().toISOString(),
  };
}

function enqueueLink({ url, submittedBy, channelId, channelName, originalText, source }) {
  const normalisedUrl = normaliseUrl(url);
  if (!normalisedUrl) {
    return { added: false, reason: 'invalid_url' };
  }

  const queue = loadQueue();
  if (hasDuplicate(queue, normalisedUrl)) {
    return { added: false, reason: 'duplicate', queueLength: queue.pending.length };
  }

  const entry = createEntry({
    url: normalisedUrl,
    submittedBy,
    channelId,
    channelName,
    originalText,
    source,
  });

  queue.pending.push(entry);
  saveQueue(queue);
  logInfo('Link enqueued', { url: entry.url, submittedBy, queueLength: queue.pending.length });

  return { added: true, entry, queueLength: queue.pending.length };
}

function popPending(limit) {
  const queue = loadQueue();
  if (queue.pending.length === 0) {
    return { entries: [], remaining: 0 };
  }
  const count = limit ? Math.min(limit, queue.pending.length) : queue.pending.length;
  const entries = queue.pending.slice(0, count);
  queue.pending = queue.pending.slice(count);
  saveQueue(queue);
  logInfo('Link queue drained', { drained: entries.length, remaining: queue.pending.length });
  return { entries, remaining: queue.pending.length };
}

function pushEntries(entries) {
  if (!entries || entries.length === 0) {
    return { queueLength: loadQueue().pending.length };
  }
  const queue = loadQueue();
  entries.forEach((entry) => {
    if (!entry || !entry.url) return;
    const normalisedUrl = entry.normalisedUrl || normaliseUrl(entry.url);
    if (!normalisedUrl) return;
    if (hasDuplicate(queue, normalisedUrl)) return;
    queue.pending.push({ ...entry, normalisedUrl });
  });
  saveQueue(queue);
  return { queueLength: queue.pending.length };
}

function getPending() {
  return loadQueue().pending;
}

module.exports = {
  enqueueLink,
  popPending,
  pushEntries,
  getPending,
  normaliseUrl,
  QUEUE_PATH,
};
