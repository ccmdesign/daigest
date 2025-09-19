const { logInfo, logWarn } = require('../../utils/logger');

function createPlaywrightProvider(renderer) {
  return {
    name: 'playwright',
    supports(url, context) {
      if (!renderer) return false;
      const { options = {}, config = {} } = context || {};
      if (options.disableBrowser) return false;
      const providerConfig = config.playwright || {};
      if (providerConfig.enabled === false) return false;
      return !url.toLowerCase().endsWith('.pdf');
    },
    async execute({ url, context }) {
      try {
        const outcome = await renderer.render(url);
        if (outcome.status === 'ok') {
          context.setHtml(outcome.html, 'playwright');
          context.setText(outcome.text, 'playwright');
          if (outcome.statusCode) {
            context.recordOutcome('playwright', {
              status: 'ok',
              statusCode: outcome.statusCode,
            });
          }
          return { status: 'ok' };
        }

        const noteParts = ['Playwright capture failed'];
        if (outcome.status === 'timeout') noteParts.push('timeout');
        if (outcome.error) noteParts.push(outcome.error);
        context.addNote(noteParts.join(': '));
        context.recordOutcome('playwright', {
          status: outcome.status,
          statusCode: outcome.statusCode,
        });
        return { status: outcome.status || 'error', error: outcome.error };
      } catch (error) {
        logWarn('Playwright provider exception', { url, error: error.message });
        context.addNote(`Playwright error: ${error.message}`);
        context.recordOutcome('playwright', { status: 'exception', error: error.message });
        return { status: 'exception', error: error.message };
      }
    },
  };
}

module.exports = { createPlaywrightProvider };
