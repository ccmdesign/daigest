const { MAX_LINKS_PER_RUN } = require('../config/defaults');
const defaultProviderConfig = require('../config/providers.json');
const { createPlaywrightRenderer } = require('./fetchers/playwrightRenderer');
const { parseHtmlArticle } = require('./parsers/htmlParser');
const { scoreConfidence, shouldRedactFields } = require('./confidence/scoring');
const { renderMarkdown } = require('./renderers/markdown');
const { writeArtifacts } = require('../outputs/writer');
const { logInfo, logWarn } = require('../utils/logger');
const { executeProviders } = require('./providers');

function sanitiseUrls(urls) {
  const deduped = Array.from(
    new Set(
      urls
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter((url) => url.startsWith('http')),
    ),
  );
  if (deduped.length > MAX_LINKS_PER_RUN) {
    logWarn('Input truncated to max links per run', {
      provided: urls.length,
      allowed: MAX_LINKS_PER_RUN,
    });
    return deduped.slice(0, MAX_LINKS_PER_RUN);
  }
  return deduped;
}

const REQUIRED_FIELDS = ['title', 'description', 'author', 'published_on', 'publication_date', 'body'];

function buildMissingFieldReason(record) {
  const missing = REQUIRED_FIELDS.filter((field) => !record[field]);
  if (missing.length === 0) return 'All key fields captured.';
  return `Missing fields: ${missing.join(', ')}`;
}

function mergeFallbackFields(context, url) {
  if (!context.html) return;
  const needsFallback = !context.getField('title') || !context.getField('description');
  if (!needsFallback) return;
  const fallback = parseHtmlArticle(context.html, url);
  Object.entries(fallback).forEach(([key, value]) => {
    if (!context.getField(key) && value) {
      context.setField(key, value, 'legacy-parser');
    }
  });
  context.addNote('Legacy HTML parser applied for missing metadata');
}

async function processUrl(url, { renderer, providerConfig, options }) {
  const providerOptions = {
    disableBrowser: options?.disableBrowser,
    trafilaturaEndpoint: options?.trafilaturaEndpoint,
    diffbot: options?.diffbot,
    expectedLanguage: options?.expectedLanguage,
  };
  const context = await executeProviders({
    url,
    renderer,
    providerConfig,
    options: providerOptions,
  });

  mergeFallbackFields(context, url);

  const recordData = context.buildRecord();
  const {
    provenance = {},
    providersUsed = [],
    notes = [],
    htmlProvider,
    textProvider,
    binaryProvider,
    providerOutcomes = [],
    ...fields
  } = recordData;

  const reasonParts = [buildMissingFieldReason(fields), ...notes];
  const reason = reasonParts.filter(Boolean).join(' | ');

  const providerLabel =
    provenance.body ||
    binaryProvider ||
    textProvider ||
    htmlProvider ||
    providersUsed[0] ||
    'unknown';

  const confidence = scoreConfidence(fields, {
    provenance,
    providersUsed,
    notes,
    providerOutcomes,
    expectedLanguage: options?.expectedLanguage,
  });
  const redacted = shouldRedactFields(confidence);

  const raw = {
    ...fields,
    provenance,
    providersUsed,
    notes,
    providerOutcomes,
  };

  const output = {
    url,
    confidence,
    reason,
    provider: providerLabel,
    raw,
    redacted,
    provenance,
    providersUsed,
  };

  if (!redacted) {
    Object.assign(output, fields);
  }

  return output;
}

async function runAgent(inputUrls, options = {}) {
  const startedAt = new Date();
  const urls = sanitiseUrls(inputUrls);
  logInfo('Starting run', { count: urls.length, startedAt: startedAt.toISOString() });

  let renderer = null;
  const providerConfig = options.providerConfig || defaultProviderConfig;
  const browserDisabled =
    options.disableBrowser ||
    process.env.DISABLE_PLAYWRIGHT === '1' ||
    providerConfig?.playwright?.enabled === false;

  if (!browserDisabled) {
    try {
      renderer = await createPlaywrightRenderer();
    } catch (error) {
      logWarn('Failed to initialise Playwright renderer, falling back to HTTP fetch', {
        error: error.message,
      });
    }
  }

  const records = [];
  try {
    for (const url of urls) {
      const result = await processUrl(url, {
        renderer,
        providerConfig,
        options,
      });
      records.push(result);
    }
  } finally {
    if (renderer) {
      await renderer.close();
    }
  }

  const durationMs = Date.now() - startedAt.getTime();
  const summary = {
    startedAt: startedAt.toISOString(),
    durationMs,
    providersUsed: Array.from(
      new Set(records.flatMap((record) => record.providersUsed || [record.provider]).filter(Boolean)),
    ),
  };

  const output = {
    metadata: {
      startedAt: summary.startedAt,
      durationMs,
      total: records.length,
    },
    records,
  };

  const shouldWriteArtifacts = options.writeArtifacts !== false;

  if (shouldWriteArtifacts) {
    const markdown = renderMarkdown(records, summary);
    const linksContent = urls.join('\n');
    writeArtifacts({ markdown, links: linksContent, json: output });
  }

  logInfo('Run completed', { durationMs, total: records.length });

  return { records, durationMs, metadata: output.metadata };
}

module.exports = { runAgent };
