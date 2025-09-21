export class ScraperContext {
  url: string
  options: any
  config: any
  html: string | null = null
  htmlProvider: string | null = null
  text: string | null = null
  textProvider: string | null = null
  binary: Buffer | null = null
  binaryProvider: string | null = null
  fields: Record<string, any> = {}
  provenance: Record<string, string> = {}
  providersUsed: Set<string> = new Set()
  notes: string[] = []
  providerOutcomes: Array<{ name: string; [key: string]: any }> = []

  constructor(url: string, options: any = {}, config: any = {}) {
    this.url = url
    this.options = options
    this.config = config
  }

  markProviderUsed(name: string) {
    if (name) this.providersUsed.add(name)
  }

  recordOutcome(name: string, outcome: Record<string, any> = {}) {
    this.providerOutcomes.push({ name, ...outcome })
  }

  addNote(note: string) {
    if (note) this.notes.push(note)
  }

  setHtml(html: string, provider: string) {
    if (html && !this.html) {
      this.html = html
      this.htmlProvider = provider
      this.markProviderUsed(provider)
    }
  }

  setText(text: string, provider: string) {
    if (text && !this.text) {
      this.text = text
      this.textProvider = provider
      this.markProviderUsed(provider)
    }
  }

  setBinary(buffer: Buffer, provider: string) {
    if (buffer && !this.binary) {
      this.binary = buffer
      this.binaryProvider = provider
      this.markProviderUsed(provider)
    }
  }

  setField(field: string, value: any, provider: string) {
    if (value === undefined || value === null) return
    if (typeof value === 'string' && value.trim() === '') return
    this.fields[field] = value
    if (provider) {
      this.provenance[field] = provider
      this.markProviderUsed(provider)
    }
  }

  getField(field: string): any {
    return this.fields[field]
  }

  buildRecord(): Record<string, any> {
    return {
      ...this.fields,
      provenance: { ...this.provenance },
      providersUsed: Array.from(this.providersUsed),
      notes: [...this.notes],
      htmlProvider: this.htmlProvider,
      textProvider: this.textProvider,
      binaryProvider: this.binaryProvider,
      providerOutcomes: [...this.providerOutcomes],
    }
  }
}