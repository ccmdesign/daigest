const fs = require('fs');
const path = require('path');

function loadEnv() {
  if (process.env.NO_DOTENV === '1') return;

  try {
    // eslint-disable-next-line global-require
    const dotenv = require('dotenv');
    const candidatePaths = [];

    if (process.env.DOTENV_PATH) {
      candidatePaths.push(process.env.DOTENV_PATH);
    }
    candidatePaths.push(path.resolve(process.cwd(), '.env'));

    const envPath = candidatePaths.find((candidate) => fs.existsSync(candidate));
    if (envPath) {
      dotenv.config({ path: envPath, override: false });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[warn] Failed to load .env file', { error: error.message });
  }
}

loadEnv();

module.exports = { loadEnv };
