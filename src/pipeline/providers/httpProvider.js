const { fetchContent } = require('../fetchers/basicFetcher');

function createHttpProvider() {
  return {
    name: 'basic-http',
    supports(url, context) {
      const providerConfig = context?.config?.['basic-http'] || {};
      if (providerConfig.enabled === false) return false;
      return !url.toLowerCase().endsWith('.pdf');
    },
    async execute({ url, context }) {
      const outcome = await fetchContent(url);
      context.recordOutcome('basic-http', {
        status: outcome.status,
        statusCode: outcome.statusCode,
      });

      if (outcome.status === 'ok' && outcome.body) {
        context.setHtml(outcome.body, 'basic-http');
        context.setText(outcome.body, 'basic-http');
        return { status: 'ok' };
      }

      if (outcome.status === 'error' || outcome.status === 'exception') {
        const reason = outcome.error || `status ${outcome.statusCode}`;
        context.addNote(`HTTP fetch failed: ${reason}`);
      }

      return { status: outcome.status || 'error', error: outcome.error };
    },
  };
}

module.exports = { createHttpProvider };
