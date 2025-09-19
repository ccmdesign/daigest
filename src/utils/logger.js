function formatMeta(meta) {
  if (!meta || Object.keys(meta).length === 0) return '';
  return JSON.stringify(meta);
}

function logInfo(message, meta = {}) {
  console.log('[info]', message, formatMeta(meta));
}

function logWarn(message, meta = {}) {
  console.warn('[warn]', message, formatMeta(meta));
}

function logError(message, meta = {}) {
  console.error('[error]', message, formatMeta(meta));
}

module.exports = { logInfo, logWarn, logError };
