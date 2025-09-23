import type { ProcessingOptions, ProcessingResult, ArticleRecord } from '~/types'

const MAX_LINKS_PER_RUN = 25
const REQUIRED_FIELDS = ['title', 'description', 'author', 'published_on', 'publication_date', 'body']

function sanitizeUrls(urls: string[]): string[] {
  const deduped = Array.from(
    new Set(
      urls
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter((url) => url.startsWith('http')),
    ),
  )
  
  if (deduped.length > MAX_LINKS_PER_RUN) {
    console.warn(`Input truncated to max links per run: ${deduped.length} -> ${MAX_LINKS_PER_RUN}`)
    return deduped.slice(0, MAX_LINKS_PER_RUN)
  }
  
  return deduped
}

function buildMissingFieldReason(record: Partial<ArticleRecord>): string {
  const missing = REQUIRED_FIELDS.filter((field) => !record[field as keyof ArticleRecord])
  if (missing.length === 0) return 'All key fields captured.'
  return `Missing fields: ${missing.join(', ')}`
}

export async function processUrls(inputUrls: string[], options: ProcessingOptions = {}): Promise<ProcessingResult> {
  const startedAt = new Date()
  const urls = sanitizeUrls(inputUrls)
  
  console.log(`Starting processing: ${urls.length} URLs`)
  
  // Import providers dynamically
  const { executeProviders } = await import('./providers/index')
  const { createPlaywrightRenderer } = await import('./fetchers/playwrightRenderer')
  const { parseHtmlArticle } = await import('./parsers/htmlParser')
  const { scoreConfidence, shouldRedactFields } = await import('./confidence/scoring')
  
  let renderer: any = null
  const browserDisabled = options.disableBrowser || process.env.DISABLE_PLAYWRIGHT === '1'
  
  if (!browserDisabled) {
    try {
      renderer = await createPlaywrightRenderer()
    } catch (error) {
      console.warn('Failed to initialize Playwright renderer, falling back to HTTP fetch:', error)
    }
  }
  
  const records: ArticleRecord[] = []
  
  try {
    for (const url of urls) {
      const result = await processUrl(url, { renderer, options })
      records.push(result)
    }
  } finally {
    if (renderer) {
      await renderer.close()
    }
  }
  
  const durationMs = Date.now() - startedAt.getTime()
  
  return {
    metadata: {
      startedAt: startedAt.toISOString(),
      durationMs,
      total: records.length,
    },
    records,
  }
}

async function processUrl(url: string, { renderer, options }: { renderer: any, options: ProcessingOptions }): Promise<ArticleRecord> {
  const { executeProviders } = await import('./providers/index')
  const { parseHtmlArticle } = await import('./parsers/htmlParser')
  const { scoreConfidence, shouldRedactFields } = await import('./confidence/scoring')
  
  const providerOptions = {
    disableBrowser: options?.disableBrowser,
    expectedLanguage: options?.expectedLanguage,
  }
  
  const context = await executeProviders({
    url,
    renderer,
    options: providerOptions,
  })
  
  // Merge fallback fields if needed
  if (context.html) {
    const needsFallback = !context.getField('title') || !context.getField('description')
    if (needsFallback) {
      const fallback = parseHtmlArticle(context.html, url)
      Object.entries(fallback).forEach(([key, value]) => {
        if (!context.getField(key) && value) {
          context.setField(key, value, 'legacy-parser')
        }
      })
      context.addNote('Legacy HTML parser applied for missing metadata')
    }
  }
  
  const recordData = context.buildRecord()
  const {
    provenance = {},
    providersUsed = [],
    notes = [],
    htmlProvider,
    textProvider,
    binaryProvider,
    providerOutcomes = [],
    ...fields
  } = recordData
  
  const reasonParts = [buildMissingFieldReason(fields), ...notes]
  const reason = reasonParts.filter(Boolean).join(' | ')
  
  const providerLabel =
    provenance.body ||
    binaryProvider ||
    textProvider ||
    htmlProvider ||
    providersUsed[0] ||
    'unknown'
  
  const confidence = scoreConfidence(fields, {
    provenance,
    providersUsed,
    notes,
    providerOutcomes,
    expectedLanguage: options?.expectedLanguage,
  })
  
  const redacted = shouldRedactFields(confidence)
  
  const output: ArticleRecord = {
    url,
    confidence,
    reason,
    provider: providerLabel,
    provenance,
    providersUsed,
    redacted,
    title: redacted ? '' : fields.title || '',
    description: redacted ? '' : fields.description || '',
    author: redacted ? '' : fields.author || '',
    published_on: redacted ? '' : fields.published_on || '',
    publication_date: redacted ? '' : fields.publication_date || '',
    body: redacted ? '' : fields.body || '',
    word_count: redacted ? 0 : fields.word_count || 0,
    publisher: redacted ? '' : fields.publisher || '',
    language: fields.language || '',
    tags: redacted ? [] : fields.tags || [],
    notes: notes || [],
    shortlisted: false,
    reviewStage: 'analyst_review',
  }

  return output
}
