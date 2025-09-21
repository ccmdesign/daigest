export interface ProcessingOptions {
  disableBrowser?: boolean
  expectedLanguage?: string
  writeArtifacts?: boolean
}

export interface ArticleRecord {
  url: string
  title: string
  description: string
  author: string
  published_on: string
  publication_date: string
  body: string
  word_count: number
  tags: string[]
  publisher: string
  language: string
  confidence: number
  reason: string
  provider: string
  provenance: Record<string, any>
  providersUsed: string[]
  notes: string[]
  redacted: boolean
}

export interface ProcessingResult {
  metadata: {
    startedAt: string
    durationMs: number
    total: number
  }
  records: ArticleRecord[]
}

export interface ScraperContext {
  url: string
  html?: string
  text?: string
  fields: Record<string, any>
  provenance: Record<string, string>
  providersUsed: string[]
  notes: string[]
  
  getField(key: string): any
  setField(key: string, value: any, provider: string): void
  addNote(note: string): void
  buildRecord(): Record<string, any>
}

export interface ProviderConfig {
  name: string
  enabled: boolean
  priority: number
  supports: (url: string) => boolean
  execute: (context: ScraperContext) => Promise<void>
}

export interface ConfidenceScore {
  score: number
  tier: 'high' | 'medium' | 'low'
  color: 'green' | 'yellow' | 'red'
}
