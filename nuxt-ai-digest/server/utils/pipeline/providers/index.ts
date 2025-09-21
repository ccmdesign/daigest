import { ScraperContext } from './scraperContext'
import type { ProviderConfig } from '~/types'

const DEFAULT_PIPELINE = ['playwright', 'basic-http', 'readability']

interface ProviderInstances {
  pdf?: ProviderConfig
  playwright?: ProviderConfig
  'basic-http'?: ProviderConfig
  readability?: ProviderConfig
  [key: string]: ProviderConfig | undefined
}

async function createProviderMap({ renderer }: { renderer?: any }): Promise<ProviderInstances> {
  const { createPlaywrightProvider } = await import('./playwrightProvider')
  const { createHttpProvider } = await import('./httpProvider')
  const { createReadabilityProvider } = await import('./readabilityProvider')
  const { createPdfProvider } = await import('./pdfProvider')
  
  return {
    pdf: createPdfProvider(),
    playwright: createPlaywrightProvider(renderer),
    'basic-http': createHttpProvider(),
    readability: createReadabilityProvider(),
  }
}

function getPipelineOrder(config?: any): string[] {
  const orderFromConfig = config && Array.isArray(config.order) ? config.order : null
  if (orderFromConfig && orderFromConfig.length > 0) return orderFromConfig
  return DEFAULT_PIPELINE
}

function selectProviders(url: string, providerInstances: ProviderInstances, config?: any): ProviderConfig[] {
  const order = getPipelineOrder(config)
  if (url.toLowerCase().endsWith('.pdf')) {
    return [providerInstances.pdf].filter(Boolean) as ProviderConfig[]
  }
  return order
    .map((name) => providerInstances[name])
    .filter(Boolean) as ProviderConfig[]
}

async function runProviderSequence(url: string, providers: ProviderConfig[], context: ScraperContext) {
  for (const provider of providers) {
    if (!provider) continue
    try {
      const supported = provider.supports ? provider.supports(url) : true
      if (!supported) continue
      await provider.execute(context)
    } catch (error: any) {
      console.warn(`Provider execution failed: ${provider.name}`, { url, error: error.message })
      context.addNote(`${provider.name} exception: ${error.message}`)
      context.recordOutcome(provider.name, { status: 'exception', error: error.message })
    }
  }
}

export async function executeProviders({ 
  url, 
  renderer, 
  options = {}, 
  providerConfig = {} 
}: { 
  url: string
  renderer?: any
  options?: any
  providerConfig?: any
}): Promise<ScraperContext> {
  const providerInstances = await createProviderMap({ renderer })
  const providers = selectProviders(url, providerInstances, providerConfig)
  const context = new ScraperContext(url, options, providerConfig)
  await runProviderSequence(url, providers, context)
  return context
}
