import type { ProviderConfig } from '~/types'
import type { ScraperContext } from './scraperContext'

let readabilityDeps: any = null
let metascraperInstance: any = null
let keywordExtractor: any = null
let franc: any = null

async function loadReadabilityDeps() {
  if (readabilityDeps) return readabilityDeps
  try {
    const { JSDOM } = await import('jsdom')
    const { Readability } = await import('@mozilla/readability')
    readabilityDeps = { JSDOM, Readability }
  } catch (error: any) {
    console.warn('Readability dependencies missing:', error.message)
    readabilityDeps = null
  }
  return readabilityDeps
}

async function loadMetascraper() {
  if (metascraperInstance) return metascraperInstance
  try {
    const metascraper = await import('metascraper')
    const metascraperAuthor = await import('metascraper-author')
    const metascraperDate = await import('metascraper-date')
    const metascraperDescription = await import('metascraper-description')
    const metascraperPublisher = await import('metascraper-publisher')
    const metascraperTitle = await import('metascraper-title')
    const metascraperUrl = await import('metascraper-url')

    metascraperInstance = metascraper.default([
      metascraperAuthor.default(),
      metascraperDate.default(),
      metascraperDescription.default(),
      metascraperPublisher.default(),
      metascraperTitle.default(),
      metascraperUrl.default(),
    ])
  } catch (error: any) {
    console.warn('Metascraper dependencies missing:', error.message)
    metascraperInstance = null
  }
  return metascraperInstance
}

async function loadKeywordExtractor() {
  if (keywordExtractor) return keywordExtractor
  try {
    keywordExtractor = await import('keyword-extractor')
  } catch (error: any) {
    console.warn('Keyword extractor missing:', error.message)
    keywordExtractor = null
  }
  return keywordExtractor
}

async function loadFranc() {
  if (franc) return franc
  try {
    franc = await import('franc')
  } catch (error: any) {
    console.warn('Franc language detector missing:', error.message)
    franc = null
  }
  return franc
}

function extractWordCount(text: string): number {
  if (!text || typeof text !== 'string') return 0
  return text.split(/\s+/).filter(word => word.length > 0).length
}

async function extractMetadata(html: string, url: string) {
  const metascraper = await loadMetascraper()
  if (!metascraper) return {}
  
  try {
    return await metascraper({ html, url })
  } catch (error: any) {
    console.warn('Metascraper extraction failed:', error.message)
    return {}
  }
}

async function extractReadabilityContent(html: string) {
  const deps = await loadReadabilityDeps()
  if (!deps) return null
  
  try {
    const dom = new deps.JSDOM(html)
    const document = dom.window.document
    const reader = new deps.Readability(document)
    return reader.parse()
  } catch (error: any) {
    console.warn('Readability parsing failed:', error.message)
    return null
  }
}

async function extractKeywords(text: string): Promise<string[]> {
  const extractor = await loadKeywordExtractor()
  if (!extractor || !text) return []
  
  try {
    return extractor.default.extract(text, {
      language: 'english',
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true
    }).slice(0, 10) // Top 10 keywords
  } catch (error: any) {
    console.warn('Keyword extraction failed:', error.message)
    return []
  }
}

async function detectLanguage(text: string): Promise<string> {
  const francLib = await loadFranc()
  if (!francLib || !text) return 'en'
  
  try {
    return francLib.franc(text) || 'en'
  } catch (error: any) {
    console.warn('Language detection failed:', error.message)
    return 'en'
  }
}

export function createReadabilityProvider(): ProviderConfig {
  return {
    name: 'readability',
    enabled: true,
    priority: 3,
    supports(url: string): boolean {
      return !url.toLowerCase().endsWith('.pdf')
    },
    async execute(context: ScraperContext): Promise<void> {
      if (!context.html) {
        context.addNote('Readability: No HTML content available')
        context.recordOutcome('readability', { status: 'skipped', reason: 'no_html' })
        return
      }

      try {
        // Extract metadata using metascraper
        const metadata = await extractMetadata(context.html, context.url)
        
        // Extract content using Readability
        const readabilityResult = await extractReadabilityContent(context.html)
        
        // Set metadata fields
        if (metadata.title) context.setField('title', metadata.title, 'readability')
        if (metadata.description) context.setField('description', metadata.description, 'readability')
        if (metadata.author) context.setField('author', metadata.author, 'readability')
        if (metadata.publisher) context.setField('publisher', metadata.publisher, 'readability')
        if (metadata.date) context.setField('published_on', metadata.date, 'readability')
        if (metadata.date) context.setField('publication_date', metadata.date, 'readability')
        
        // Set content from Readability
        if (readabilityResult) {
          if (readabilityResult.title && !context.getField('title')) {
            context.setField('title', readabilityResult.title, 'readability')
          }
          if (readabilityResult.content) {
            context.setField('body', readabilityResult.content, 'readability')
            
            // Extract additional data
            const wordCount = extractWordCount(readabilityResult.textContent || '')
            if (wordCount > 0) context.setField('word_count', wordCount, 'readability')
            
            // Extract keywords
            const keywords = await extractKeywords(readabilityResult.textContent || '')
            if (keywords.length > 0) context.setField('tags', keywords, 'readability')
            
            // Detect language
            const language = await detectLanguage(readabilityResult.textContent || '')
            context.setField('language', language, 'readability')
          }
        }
        
        context.recordOutcome('readability', { status: 'ok' })
        
      } catch (error: any) {
        context.addNote(`Readability extraction failed: ${error.message}`)
        context.recordOutcome('readability', { status: 'exception', error: error.message })
      }
    },
  }
}
