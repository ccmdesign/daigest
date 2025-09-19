const { chromium } = require('playwright-core');
const {
  PLAYWRIGHT_TIMEOUT_MS,
  USER_AGENT,
} = require('../../config/defaults');
const { logInfo, logWarn } = require('../../utils/logger');

const SERVERLESS_MODE = process.env.PLAYWRIGHT_SERVERLESS === '1';
let serverlessChromium = null;

function getServerlessChromium() {
  if (serverlessChromium) return serverlessChromium;
  try {
    // eslint-disable-next-line global-require
    serverlessChromium = require('@sparticuz/chromium-min');
    return serverlessChromium;
  } catch (error) {
    logWarn('Serverless Chromium dependency missing', { error: error.message });
    serverlessChromium = null;
    return null;
  }
}

async function launchBrowser(headlessOption) {
  const baseOptions = { headless: headlessOption };

  if (SERVERLESS_MODE) {
    const chromiumLambda = getServerlessChromium();
    if (!chromiumLambda) {
      throw new Error('PLAYWRIGHT_SERVERLESS=1 but @sparticuz/chromium-min is not installed');
    }

    const executablePath = await chromiumLambda.executablePath();
    Object.assign(baseOptions, {
      args: chromiumLambda.args,
      executablePath,
      headless: chromiumLambda.headless !== undefined ? chromiumLambda.headless : headlessOption,
      chromiumSandbox: false,
    });
  }

  return chromium.launch(baseOptions);
}

function formatPlaywrightError(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return JSON.stringify(error);
}

async function createPlaywrightRenderer(options = {}) {
  const headless = options.headless !== undefined ? options.headless : true;
  const timeout = options.timeout || PLAYWRIGHT_TIMEOUT_MS;

  const browser = await launchBrowser(headless);
  const contextOptions = { userAgent: USER_AGENT };

  if (SERVERLESS_MODE) {
    const chromiumLambda = getServerlessChromium();
    if (chromiumLambda?.defaultViewport) {
      contextOptions.viewport = chromiumLambda.defaultViewport;
    }
  }

  const context = await browser.newContext(contextOptions);

  logInfo('Playwright browser launched');

  async function render(url) {
    const page = await context.newPage();
    let response;

    try {
      response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout,
      });

      try {
        const idleTimeout = Math.max(1000, Math.floor(timeout / 2));
        await page.waitForLoadState('networkidle', { timeout: idleTimeout });
      } catch (postLoadError) {
        const waitError = formatPlaywrightError(postLoadError);
        logInfo('Playwright network idle wait skipped', { url, error: waitError });
      }

      const html = await page.content();
      const text = await page.evaluate(() => document.body?.innerText || '');
      const finalUrl = page.url();
      const statusCode = response ? response.status() : null;

      return {
        provider: 'playwright',
        status: 'ok',
        html,
        text,
        finalUrl,
        statusCode,
      };
    } catch (error) {
      const formatted = formatPlaywrightError(error);
      const isTimeout = error && error.name === 'TimeoutError';
      logWarn('Playwright navigation failed', { url, error: formatted });

      return {
        provider: 'playwright',
        status: isTimeout ? 'timeout' : 'error',
        error: formatted,
        statusCode: response ? response.status() : null,
      };
    } finally {
      await page.close();
    }
  }

  async function close() {
    await context.close();
    await browser.close();
    logInfo('Playwright browser closed');
  }

  return { render, close };
}

module.exports = { createPlaywrightRenderer };
