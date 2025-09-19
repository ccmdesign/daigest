const { logWarn } = require('../../utils/logger');

function resolveTrafilaturaConfig(context) {
  const { config = {}, options = {} } = context || {};
  const providerConfig = config.trafilatura || {};
  if (options.trafilaturaEndpoint) {
    return { ...providerConfig, endpoint: options.trafilaturaEndpoint, enabled: true };
  }
  return providerConfig;
}

function createTrafilaturaProvider() {
  return {
    name: 'trafilatura',
    supports(url, context) {
      if (url.toLowerCase().endsWith('.pdf')) return false;
      const providerConfig = resolveTrafilaturaConfig(context);
      return Boolean(providerConfig && providerConfig.enabled && providerConfig.endpoint);
    },
    async execute({ url, context }) {
      const config = resolveTrafilaturaConfig(context);
      if (!config || !config.endpoint) {
        context.addNote('Trafilatura disabled');
        return { status: 'skipped' };
      }

      try {
        const payload = {
          url,
          html: context.html,
        };
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const reason = `status ${response.status}`;
          context.addNote(`Trafilatura failed: ${reason}`);
          context.recordOutcome('trafilatura', { status: 'error', statusCode: response.status });
          return { status: 'error', error: reason };
        }

        const data = await response.json();

        if (data.title) context.setField('title', data.title, 'trafilatura');
        if (data.author) context.setField('author', data.author, 'trafilatura');
        if (data.date || data.publication_date) {
          context.setField('publication_date', data.date || data.publication_date, 'trafilatura');
        }
        if (data.language) context.setField('language', data.language, 'trafilatura');
        if (data.text) {
          context.setField('body', data.text, 'trafilatura');
          const words = data.text.split(/\s+/).filter(Boolean).length;
          context.setField('word_count', words, 'trafilatura');
        }
        if (Array.isArray(data.tags)) {
          context.setField('tags', data.tags, 'trafilatura');
        }
        context.recordOutcome('trafilatura', { status: 'ok' });
        context.addNote('Trafilatura fallback used');
        return { status: 'ok' };
      } catch (error) {
        logWarn('Trafilatura request failed', { url, error: error.message });
        context.addNote(`Trafilatura error: ${error.message}`);
        context.recordOutcome('trafilatura', { status: 'error', error: error.message });
        return { status: 'error', error: error.message };
      }
    },
  };
}

module.exports = { createTrafilaturaProvider };
