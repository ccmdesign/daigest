import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..');

test.describe('Digest artifacts', () => {
  test('article_scraping_results markdown uses review layout', async () => {
    const markdownPath = path.join(repoRoot, 'article_scraping_results.md');
    const markdown = await fs.readFile(markdownPath, 'utf-8');

    expect(markdown).toContain('# Digest Review');
    expect(markdown).toContain('## Run Summary');
    expect(markdown).toContain('## Articles');
    expect(markdown).toMatch(/### \d+\. /);
  });

  test('links list contains valid URLs', async () => {
    const linksPath = path.join(repoRoot, 'links.md');
    const linksFile = await fs.readFile(linksPath, 'utf-8');
    const urls = linksFile.trim().split(/\r?\n/).filter(Boolean);

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^https?:\/\/\S+$/);
    }
  });

  test('digest json includes provenance metadata', async () => {
    const digestPath = path.join(repoRoot, 'digest.json');
    const digestRaw = await fs.readFile(digestPath, 'utf-8');
    const digest = JSON.parse(digestRaw);

    expect(Array.isArray(digest.records)).toBe(true);
    expect(digest.records.length).toBeGreaterThan(0);
    for (const record of digest.records) {
      expect(record).toHaveProperty('provenance');
      expect(record).toHaveProperty('providersUsed');
      expect(record).toHaveProperty('raw');
      expect(record.raw).toHaveProperty('providerOutcomes');
    }
  });
});
