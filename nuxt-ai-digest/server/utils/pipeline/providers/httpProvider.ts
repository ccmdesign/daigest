import type { ProviderConfig } from '~/types'
import type { ScraperContext } from './scraperContext'

async function fetchContent(url: string): Promise<{ status: string; body?: string; statusCode?: number; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      return {
        status: 'error',
        statusCode: response.status,
        error: `HTTP ${response.status}`
      }
    }
    
    const body = await response.text()
    return {
      status: 'ok',
      body,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      status: 'exception',
      error: error.message
    }
  }
}

export function createHttpProvider(): ProviderConfig {
  return {
    name: 'basic-http',
    enabled: true,
    priority: 2,
    supports(url: string): boolean {
      return !url.toLowerCase().endsWith('.pdf')
    },
    async execute(context: ScraperContext): Promise<void> {
      const outcome = await fetchContent(context.url)
      context.recordOutcome('basic-http', {
        status: outcome.status,
        statusCode: outcome.statusCode,
      })

      if (outcome.status === 'ok' && outcome.body) {
        context.setHtml(outcome.body, 'basic-http')
        context.setText(outcome.body, 'basic-http')
        return
      }

      if (outcome.status === 'error' || outcome.status === 'exception') {
        const reason = outcome.error || `status ${outcome.statusCode}`
        context.addNote(`HTTP fetch failed: ${reason}`)
      }
    },
  }
}
