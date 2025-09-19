class ScraperContext {
  constructor(url, options = {}, config = {}) {
    this.url = url;
    this.options = options;
    this.config = config;
    this.html = null;
    this.htmlProvider = null;
    this.text = null;
    this.textProvider = null;
    this.binary = null;
    this.binaryProvider = null;
    this.fields = {};
    this.provenance = {};
    this.providersUsed = new Set();
    this.notes = [];
    this.providerOutcomes = [];
  }

  markProviderUsed(name) {
    if (name) this.providersUsed.add(name);
  }

  recordOutcome(name, outcome = {}) {
    this.providerOutcomes.push({ name, ...outcome });
  }

  addNote(note) {
    if (note) this.notes.push(note);
  }

  setHtml(html, provider) {
    if (html && !this.html) {
      this.html = html;
      this.htmlProvider = provider;
      this.markProviderUsed(provider);
    }
  }

  setText(text, provider) {
    if (text && !this.text) {
      this.text = text;
      this.textProvider = provider;
      this.markProviderUsed(provider);
    }
  }

  setBinary(buffer, provider) {
    if (buffer && !this.binary) {
      this.binary = buffer;
      this.binaryProvider = provider;
      this.markProviderUsed(provider);
    }
  }

  setField(field, value, provider) {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    this.fields[field] = value;
    if (provider) {
      this.provenance[field] = provider;
      this.markProviderUsed(provider);
    }
  }

  getField(field) {
    return this.fields[field];
  }

  buildRecord() {
    return {
      ...this.fields,
      provenance: { ...this.provenance },
      providersUsed: Array.from(this.providersUsed),
      notes: [...this.notes],
      htmlProvider: this.htmlProvider,
      textProvider: this.textProvider,
      binaryProvider: this.binaryProvider,
      providerOutcomes: [...this.providerOutcomes],
    };
  }
}

module.exports = { ScraperContext };
