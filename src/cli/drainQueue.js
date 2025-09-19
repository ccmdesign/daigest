#!/usr/bin/env node
const { popPending, pushEntries } = require('../intake/linkQueue');
const { runAgent } = require('../pipeline/runAgent');
const { MAX_LINKS_PER_RUN } = require('../config/defaults');
const { logInfo, logError } = require('../utils/logger');

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { limit: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--limit' || arg === '-n') {
      const value = Number(args[index + 1]);
      if (!Number.isNaN(value) && value > 0) {
        result.limit = value;
      }
      index += 1;
    }
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv);
  const plannedLimit = options.limit || MAX_LINKS_PER_RUN;
  const { entries } = popPending(plannedLimit);

  if (!entries || entries.length === 0) {
    logInfo('No queued links to process');
    return;
  }

  const urls = entries.map((entry) => entry.url);
  logInfo('Draining queued links', { count: urls.length });

  try {
    await runAgent(urls);
    logInfo('Queue processed successfully');
  } catch (error) {
    logError('Queue processing failed; re-queueing links', { error: error.message });
    pushEntries(entries);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs };
