const { logWarn } = require('../../utils/logger');

function resolveConfig(context) {
  const { config = {}, options = {} } = context || {};
  return { ...config.diffbot, ...options.diffbot };
}

function createDiffbotProvider() {
  return {
    name: 'diffbot',
    supports(url, context) {
      if (url.toLowerCase().endsWith('.pdf')) return false;
      const providerConfig = resolveConfig(context);
      return Boolean(providerConfig && providerConfig.enabled);
    },
    async execute({ url, context }) {
      const providerConfig = resolveConfig(context);
      const token = providerConfig.token || process.env.DIFFBOT_API_TOKEN;
      if (!token) {
        context.addNote('Diffbot disabled (missing token)');
        return { status: 'skipped' };
      }

      const endpoint = providerConfig.endpoint || 'https://api.diffbot.com/v3/article';
      const requestUrl = `${endpoint}?token=${encodeURIComponent(token)}&url=${encodeURIComponent(url)}`;

      try {
        const response = await fetch(requestUrl);
        if (!response.ok) {
          const reason = `status ${response.status}`;
          context.addNote(`Diffbot failed: ${reason}`);
          context.recordOutcome('diffbot', { status: 'error', statusCode: response.status });
          return { status: 'error', error: reason };
        }

        const payload = await response.json();
        const objects = Array.isArray(payload.objects) ? payload.objects : [];
        if (objects.length === 0) {
          context.addNote('Diffbot returned no article object');
          context.recordOutcome('diffbot', { status: 'empty' });
          return { status: 'empty' };
        }

        const article = objects[0];
        if (article.title) context.setField('title', article.title, 'diffbot');
        if (article.text) {
          context.setField('body', article.text, 'diffbot');
          const words = article.text.split(/\s+/).filter(Boolean).length;
          context.setField('word_count', words, 'diffbot');
        }
        if (article.author) context.setField('author', article.author, 'diffbot');
        if (article.date) context.setField('publication_date', article.date, 'diffbot');
        if (article.siteName) context.setField('published_on', article.siteName, 'diffbot');
        if (article.tags) {
          const tags = Array.isArray(article.tags)
            ? article.tags.map((tag) => (typeof tag === 'string' ? tag : tag.label)).filter(Boolean)
            : [];
          if (tags.length > 0) context.setField('tags', tags, 'diffbot');
        }

        context.recordOutcome('diffbot', { status: 'ok' });
        context.addNote('Diffbot fallback used');
        return { status: 'ok' };
      } catch (error) {
        logWarn('Diffbot request failed', { url, error: error.message });
        context.addNote(`Diffbot error: ${error.message}`);
        context.recordOutcome('diffbot', { status: 'error', error: error.message });
        return { status: 'error', error: error.message };
      }
    },
  };
}

module.exports = { createDiffbotProvider };
