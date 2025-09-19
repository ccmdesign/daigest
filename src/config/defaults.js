const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd());

module.exports = {
  OUTPUT_DIR,
  OUTPUT_FILES: {
    markdown: path.join(OUTPUT_DIR, 'article_scraping_results.md'),
    links: path.join(OUTPUT_DIR, 'links.md'),
    json: path.join(OUTPUT_DIR, 'digest.json'),
  },
  SCRAPER_PROVIDERS: ['firecrawl', 'playwright', 'brightdata', 'pdf'],
  USER_AGENT:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  REQUEST_TIMEOUT_MS: 12000,
  MAX_LINKS_PER_RUN: 10,
  PLAYWRIGHT_TIMEOUT_MS: 20000,
};
