const { REQUEST_TIMEOUT_MS, USER_AGENT } = require('../../config/defaults');
const { logWarn } = require('../../utils/logger');

let pdfParse;

function loadPdfParser() {
  if (pdfParse) return pdfParse;
  try {
    // eslint-disable-next-line global-require
    pdfParse = require('pdf-parse');
  } catch (error) {
    logWarn('pdf-parse dependency missing', { error: error.message });
    pdfParse = null;
  }
  return pdfParse;
}

async function fetchPdfBinary(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { status: 'error', statusCode: response.status };
    }
    const arrayBuffer = await response.arrayBuffer();
    return { status: 'ok', buffer: Buffer.from(arrayBuffer) };
  } catch (error) {
    return { status: 'error', error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function inferTitle(data, text) {
  if (data.info && data.info.Title) {
    return String(data.info.Title).trim();
  }
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return lines[0];
}

function inferAuthor(data) {
  if (data.info && data.info.Author) {
    return String(data.info.Author).trim();
  }
  if (data.metadata && data.metadata.has('Author')) {
    return String(data.metadata.get('Author')).trim();
  }
  return null;
}

function computeWordCount(text) {
  if (!text) return null;
  const words = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  return words.length || null;
}

function createPdfProvider() {
  return {
    name: 'pdf',
    supports(url, context) {
      const providerConfig = context?.config?.pdf || {};
      if (providerConfig.enabled === false) return false;
      return url.toLowerCase().endsWith('.pdf');
    },
    async execute({ url, context }) {
      const parser = loadPdfParser();
      if (!parser) {
        context.addNote('PDF parser unavailable (missing dependency)');
        return { status: 'skipped' };
      }

      const binaryOutcome = await fetchPdfBinary(url);
      if (binaryOutcome.status !== 'ok') {
        const reason = binaryOutcome.error || `status ${binaryOutcome.statusCode}`;
        context.addNote(`PDF fetch failed: ${reason}`);
        context.recordOutcome('pdf', { status: 'error', error: reason });
        return { status: 'error', error: reason };
      }

      try {
        const data = await parser(binaryOutcome.buffer);
        const text = data.text ? data.text.trim() : '';
        context.setBinary(binaryOutcome.buffer, 'pdf');
        if (text) {
          context.setField('body', text, 'pdf');
          context.setField('word_count', computeWordCount(text), 'pdf');
        }
        context.setField('title', inferTitle(data, text), 'pdf');
        const author = inferAuthor(data);
        if (author) context.setField('author', author, 'pdf');
        if (data.info && data.info.CreationDate) {
          context.setField('publication_date', data.info.CreationDate, 'pdf');
        }
        context.recordOutcome('pdf', { status: 'ok' });
        context.addNote('PDF content extracted');
        return { status: 'ok' };
      } catch (error) {
        logWarn('PDF parsing failed', { url, error: error.message });
        context.addNote(`PDF parsing failed: ${error.message}`);
        context.recordOutcome('pdf', { status: 'error', error: error.message });
        return { status: 'error', error: error.message };
      }
    },
  };
}

module.exports = { createPdfProvider };
