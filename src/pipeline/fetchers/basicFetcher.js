const { REQUEST_TIMEOUT_MS, USER_AGENT } = require('../../config/defaults');
const { logInfo, logWarn, logError } = require('../../utils/logger');

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'user-agent': USER_AGENT,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchContent(url) {
  logInfo('Fetching', { url });

  if (url.toLowerCase().endsWith('.pdf')) {
    logWarn('PDF detected; skipping fetch in MVP', { url });
    return { provider: 'pdf', kind: 'pdf', body: null, status: 'skipped' };
  }

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      logWarn('Fetch failed', { url, status: response.status });
      return {
        provider: 'basic-http',
        kind: 'html',
        body: null,
        status: 'error',
        statusCode: response.status,
      };
    }
    const text = await response.text();
    return {
      provider: 'basic-http',
      kind: 'html',
      body: text,
      status: 'ok',
      statusCode: response.status,
    };
  } catch (error) {
    logError('Fetch exception', { url, error: error.message });
    return {
      provider: 'basic-http',
      kind: 'html',
      body: null,
      status: 'exception',
      error: error.message,
    };
  }
}

module.exports = { fetchContent };
