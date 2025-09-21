import type { ProviderConfig } from '~/types'
import type { ScraperContext } from './scraperContext'

export function createPlaywrightProvider(renderer?: any): ProviderConfig {
  return {
    name: 'playwright',
    enabled: true,
    priority: 1,
    supports(url: string): boolean {
      return !url.toLowerCase().endsWith('.pdf')
    },
    async execute(context: ScraperContext): Promise<void> {
      if (!renderer) {
        context.addNote('Playwright: No renderer available')
        context.recordOutcome('playwright', { status: 'skipped', reason: 'no_renderer' })
        return
      }

      try {
        const result = await renderer.render(context.url)
        
        if (result.status === 'ok' && result.html) {
          context.setHtml(result.html, 'playwright')
          context.setText(result.html, 'playwright')
          context.recordOutcome('playwright', { status: 'ok' })
        } else {
          context.addNote(`Playwright rendering failed: ${result.error || 'unknown error'}`)
          context.recordOutcome('playwright', { 
            status: result.status || 'error', 
            error: result.error 
          })
        }
      } catch (error: any) {
        context.addNote(`Playwright exception: ${error.message}`)
        context.recordOutcome('playwright', { status: 'exception', error: error.message })
      }
    },
  }
}
