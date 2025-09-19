#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { runAgent } = require('../pipeline/runAgent');
const { logError, logInfo } = require('../utils/logger');
const { loadProvidersConfig } = require('../pipeline/providers');

function parseArgs(argv) {
  const args = argv.slice(2);
  const urls = [];
  let inputFile = null;
  let providersPath = null;
  let disableBrowser = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input' || arg === '-i') {
      inputFile = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--providers') {
      providersPath = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--no-browser') {
      disableBrowser = true;
      continue;
    }
    urls.push(arg);
  }

  if (inputFile) {
    const resolved = path.resolve(process.cwd(), inputFile);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Input file not found: ${resolved}`);
    }
    const fileContents = fs.readFileSync(resolved, 'utf-8');
    const fileUrls = fileContents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    urls.push(...fileUrls);
  }

  const options = {};
  if (disableBrowser) {
    options.disableBrowser = true;
  }

  if (providersPath) {
    options.providerConfig = loadProvidersConfig(providersPath);
  }

  return { urls, options };
}

async function main() {
  try {
    const { urls, options } = parseArgs(process.argv);
    if (urls.length === 0) {
      logError('No URLs provided. Pass links as arguments or via --input <file>.');
      process.exitCode = 1;
      return;
    }
    await runAgent(urls, options);
    logInfo('Artifacts ready', {
      markdown: 'article_scraping_results.md',
      links: 'links.md',
      json: 'digest.json',
    });
  } catch (error) {
    logError('Run failed', { error: error.message });
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
