import type { ProviderConfig } from '~/types'
import type { ScraperContext } from './scraperContext'

export function createPdfProvider(): ProviderConfig {
  return {
    name: 'pdf',
    enabled: true,
    priority: 1,
    supports(url: string): boolean {
      return url.toLowerCase().endsWith('.pdf')
    },
    async execute(context: ScraperContext): Promise<void> {
      try {
        // Fetch PDF content
        const response = await fetch(context.url)
        if (!response.ok) {
          context.addNote(`PDF fetch failed: HTTP ${response.status}`)
          context.recordOutcome('pdf', { status: 'error', statusCode: response.status })
          return
        }
        
        const buffer = await response.arrayBuffer()
        context.setBinary(Buffer.from(buffer), 'pdf')
        
        // Parse PDF using pdf-parse
        const pdfParse = await import('pdf-parse')
        const data = await pdfParse.default(buffer)
        
        if (data.text) {
          context.setText(data.text, 'pdf')
          context.setField('body', data.text, 'pdf')
          context.setField('word_count', data.text.split(/\s+/).length, 'pdf')
          
          // Try to extract title from first line or metadata
          const lines = data.text.split('\n').filter(line => line.trim())
          if (lines.length > 0) {
            context.setField('title', lines[0].trim(), 'pdf')
          }
          
          // Try to extract basic metadata
          if (data.info) {
            if (data.info.Title) context.setField('title', data.info.Title, 'pdf')
            if (data.info.Author) context.setField('author', data.info.Author, 'pdf')
            if (data.info.Subject) context.setField('description', data.info.Subject, 'pdf')
            if (data.info.CreationDate) {
              context.setField('published_on', data.info.CreationDate, 'pdf')
              context.setField('publication_date', data.info.CreationDate, 'pdf')
            }
          }
        }
        
        context.recordOutcome('pdf', { status: 'ok', pages: data.numpages })
        
      } catch (error: any) {
        context.addNote(`PDF parsing failed: ${error.message}`)
        context.recordOutcome('pdf', { status: 'exception', error: error.message })
      }
    },
  }
}
