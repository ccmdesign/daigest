const { URL } = require('url');

function extractBetween(html, start, end) {
  const startIndex = html.indexOf(start);
  if (startIndex === -1) return null;
  const endIndex = html.indexOf(end, startIndex + start.length);
  if (endIndex === -1) return null;
  return html.slice(startIndex + start.length, endIndex).trim();
}

function extractTitle(html) {
  const raw = extractBetween(html, '<title>', '</title>');
  if (!raw) return null;
  return raw.replace(/\s+/g, ' ').trim();
}

function matchMeta(html, key) {
  const regex = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, 'i');
  const tagMatch = html.match(regex);
  if (!tagMatch) return null;
  const contentMatch = tagMatch[0].match(/content=["']([^"']+)["']/i);
  if (!contentMatch) return null;
  return contentMatch[1].trim();
}

function pickFirst(html, keys) {
  for (const key of keys) {
    const value = matchMeta(html, key);
    if (value) return value;
  }
  return null;
}

function extractDescription(html) {
  return pickFirst(html, ['description', 'og:description', 'twitter:description']);
}

function extractAuthor(html) {
  return pickFirst(html, ['author', 'article:author', 'twitter:creator']);
}

function extractPublication(html, url) {
  const siteName = pickFirst(html, ['og:site_name', 'application-name']);
  if (siteName) return siteName;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (error) {
    return null;
  }
}

function extractPublishDate(html) {
  return pickFirst(html, [
    'article:published_time',
    'og:published_time',
    'date',
    'pubdate',
    'lastmod',
  ]);
}

function extractTags(html) {
  const keywords = pickFirst(html, ['keywords', 'news_keywords']);
  if (!keywords) return [];
  return keywords
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function determineWordCount(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return null;
  const text = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.split(' ').length;
}

function parseHtmlArticle(html, url) {
  const title = extractTitle(html);
  const description = extractDescription(html);
  const author = extractAuthor(html);
  const publishedOn = extractPublication(html, url);
  const publicationDate = extractPublishDate(html);
  const tags = extractTags(html);
  const wordCount = determineWordCount(html);

  return {
    title,
    description,
    author,
    published_on: publishedOn,
    publication_date: publicationDate,
    tags,
    word_count: wordCount,
  };
}

module.exports = { parseHtmlArticle };
