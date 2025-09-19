const { logWarn } = require('../../utils/logger');

let readabilityDeps;
let metascraperInstance;
let keywordExtractor;
let franc;

function loadReadabilityDeps() {
  if (readabilityDeps) return readabilityDeps;
  try {
    const { JSDOM } = require('jsdom');
    const { Readability } = require('@mozilla/readability');
    readabilityDeps = { JSDOM, Readability };
  } catch (error) {
    logWarn('Readability dependencies missing', { error: error.message });
    readabilityDeps = null;
  }
  return readabilityDeps;
}

function loadMetascraper() {
  if (metascraperInstance) return metascraperInstance;
  try {
    const metascraper = require('metascraper');
    const metascraperAuthor = require('metascraper-author');
    const metascraperDate = require('metascraper-date');
    const metascraperDescription = require('metascraper-description');
    const metascraperPublisher = require('metascraper-publisher');
    const metascraperTitle = require('metascraper-title');
    const metascraperUrl = require('metascraper-url');

    metascraperInstance = metascraper([
      metascraperAuthor(),
      metascraperDate(),
      metascraperDescription(),
      metascraperPublisher(),
      metascraperTitle(),
      metascraperUrl(),
    ]);
  } catch (error) {
    logWarn('Metascraper dependencies missing', { error: error.message });
    metascraperInstance = null;
  }
  return metascraperInstance;
}

function loadKeywordExtractor() {
  if (keywordExtractor) return keywordExtractor;
  try {
    keywordExtractor = require('keyword-extractor');
  } catch (error) {
    logWarn('Keyword extractor dependency missing', { error: error.message });
    keywordExtractor = null;
  }
  return keywordExtractor;
}

function loadFranc() {
  if (franc) return franc;
  try {
    franc = require('franc');
  } catch (error) {
    logWarn('Franc dependency missing', { error: error.message });
    franc = null;
  }
  return franc;
}

function normaliseKeywords(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function extractBodyKeywords(bodyText, languageCode) {
  const extractor = loadKeywordExtractor();
  if (!extractor || !bodyText) return [];
  const lang = languageCode === 'eng' ? 'english' : 'english';
  try {
    return extractor
      .extract(bodyText, {
        language: lang,
        remove_digits: true,
        return_changed_case: false,
        remove_duplicates: true,
      })
      .slice(0, 10);
  } catch (error) {
    logWarn('Keyword extraction failed', { error: error.message });
    return [];
  }
}

function detectLanguage(bodyText) {
  const francFn = loadFranc();
  if (!francFn || !bodyText) return null;
  try {
    const lang = francFn(bodyText);
    if (lang === 'und') return null;
    return lang;
  } catch (error) {
    logWarn('Language detection failed', { error: error.message });
    return null;
  }
}

function computeWordCount(bodyText) {
  if (!bodyText) return null;
  const words = bodyText
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.length;
}

function createReadabilityProvider() {
  return {
    name: 'readability',
    supports(_url, context) {
      const providerConfig = context?.config?.readability;
      if (providerConfig === false) return false;
      if (providerConfig && providerConfig.enabled === false) return false;
      const deps = loadReadabilityDeps();
      return Boolean(deps);
    },
    async execute({ url, context }) {
      const deps = loadReadabilityDeps();
      if (!deps) {
        context.addNote('Readability disabled (missing dependencies)');
        return { status: 'skipped' };
      }
      const { JSDOM, Readability } = deps;

      if (!context.html) {
        return { status: 'skipped', reason: 'html-missing' };
      }

      try {
        const dom = new JSDOM(context.html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        const metascraper = loadMetascraper();
        let meta = {};
        if (metascraper) {
          try {
            meta = (await metascraper({ url, html: context.html })) || {};
          } catch (metaError) {
            logWarn('Metascraper extraction failed', { error: metaError.message });
            context.addNote(`Metascraper failed: ${metaError.message}`);
          }
        } else {
          context.addNote('Metascraper disabled (missing dependencies)');
        }

        let bodyKeywords = [];
        if (article && article.textContent) {
          const cleanedText = article.textContent.trim();
          context.setField('body', cleanedText, 'readability');
          context.setField('word_count', computeWordCount(cleanedText), 'readability');
          const languageCode = detectLanguage(cleanedText);
          context.setField('language', languageCode, 'readability');
          bodyKeywords = extractBodyKeywords(cleanedText, languageCode);
        }

        if (article && article.title) {
          context.setField('title', article.title.trim(), 'readability');
        }
        if (article && article.byline) {
          context.setField('author', article.byline.trim(), 'readability');
        }

        if (meta.title && !context.getField('title')) {
          context.setField('title', meta.title, 'metascraper');
        }
        if (meta.description) {
          context.setField('description', meta.description, 'metascraper');
        }
        if (meta.author && !context.getField('author')) {
          context.setField('author', meta.author, 'metascraper');
        }
        if (meta.date) {
          context.setField('publication_date', meta.date, 'metascraper');
        }
        if (meta.publisher) {
          context.setField('published_on', meta.publisher, 'metascraper');
        }
        if (meta.url) {
          context.setField('final_url', meta.url, 'metascraper');
        }
        const keywordList = normaliseKeywords(meta.keywords);
        const combined = Array.from(new Set([...keywordList, ...bodyKeywords]));
        if (combined.length > 0) {
          context.setField('tags', combined, keywordList.length > 0 ? 'metascraper' : 'readability');
        }

        const wordCount = context.getField('word_count');
        if (!wordCount || wordCount < 200) {
          context.addNote('Article body short or missing (Readability)');
        }

        context.recordOutcome('readability', { status: 'ok' });
        return { status: 'ok' };
      } catch (error) {
        logWarn('Readability extraction failed', { url, error: error.message });
        context.addNote(`Readability failed: ${error.message}`);
        context.recordOutcome('readability', { status: 'error', error: error.message });
        return { status: 'error', error: error.message };
      }
    },
  };
}

module.exports = { createReadabilityProvider };
