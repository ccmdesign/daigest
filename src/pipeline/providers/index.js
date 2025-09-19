const fs = require('fs');
const path = require('path');
const { ScraperContext } = require('./scraperContext');
const { createPlaywrightProvider } = require('./playwrightProvider');
const { createHttpProvider } = require('./httpProvider');
const { createReadabilityProvider } = require('./readabilityProvider');
const { createPdfProvider } = require('./pdfProvider');
const { createTrafilaturaProvider } = require('./trafilaturaProvider');
const { createDiffbotProvider } = require('./diffbotProvider');
const { logWarn } = require('../../utils/logger');

const DEFAULT_PIPELINE = ['playwright', 'basic-http', 'readability', 'trafilatura', 'diffbot'];

function loadProvidersConfig(inlineConfig) {
  if (!inlineConfig) return {};
  if (typeof inlineConfig === 'string') {
    const resolved = path.resolve(process.cwd(), inlineConfig);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Providers config not found: ${resolved}`);
    }
    const fileContents = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(fileContents);
  }
  return inlineConfig;
}

function createProviderMap({ renderer }) {
  return {
    pdf: createPdfProvider(),
    playwright: createPlaywrightProvider(renderer),
    'basic-http': createHttpProvider(),
    readability: createReadabilityProvider(),
    trafilatura: createTrafilaturaProvider(),
    diffbot: createDiffbotProvider(),
  };
}

function getPipelineOrder(config) {
  const orderFromConfig = config && Array.isArray(config.order) ? config.order : null;
  if (orderFromConfig && orderFromConfig.length > 0) return orderFromConfig;
  return DEFAULT_PIPELINE;
}

function selectProviders(url, providerInstances, config) {
  const order = getPipelineOrder(config);
  if (url.toLowerCase().endsWith('.pdf')) {
    return [providerInstances.pdf].filter(Boolean);
  }
  return order
    .map((name) => providerInstances[name])
    .filter(Boolean);
}

async function runProviderSequence(url, providers, context) {
  for (const provider of providers) {
    if (!provider) continue;
    try {
      const supported = provider.supports ? provider.supports(url, context) : true;
      if (!supported) continue;
      await provider.execute({ url, context });
    } catch (error) {
      logWarn('Provider execution failed', { provider: provider.name, url, error: error.message });
      context.addNote(`${provider.name} exception: ${error.message}`);
      context.recordOutcome(provider.name, { status: 'exception', error: error.message });
    }
  }
}

async function executeProviders({ url, renderer, options = {}, providerConfig = {} }) {
  const providerInstances = createProviderMap({ renderer });
  const providers = selectProviders(url, providerInstances, providerConfig);
  const context = new ScraperContext(url, options, providerConfig);
  await runProviderSequence(url, providers, context);
  return context;
}

module.exports = { loadProvidersConfig, executeProviders };
