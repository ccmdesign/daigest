import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..');
const REVIEW_STAGE_VALUES = [
  'analyst_review',
  'awaiting_manager',
  'needs_revision',
  'shortlisted',
  'saved_for_later',
];

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

  test('digest json review stages align with shortlist counts', async () => {
    const digestPath = path.join(repoRoot, 'digest.json');
    const digestRaw = await fs.readFile(digestPath, 'utf-8');
    const digest = JSON.parse(digestRaw);

    const records = Array.isArray(digest.records) ? digest.records : [];
    const shortlisted = records.filter((record) => Boolean(record.shortlisted));

    expect(records.length).toBeGreaterThan(0);
    expect(digest.summary?.shortlistedTotal ?? shortlisted.length).toBe(shortlisted.length);

    for (const record of records) {
      const { reviewStage, shortlisted: isShortlisted } = record;
      expect(REVIEW_STAGE_VALUES).toContain(reviewStage ?? 'analyst_review');
      if (isShortlisted) {
        expect(reviewStage).toBe('shortlisted');
      }
    }
  });
});
