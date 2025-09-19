function formatList(values = []) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (value === null || value === undefined ? '' : String(value).trim()))
    .filter(Boolean);
}

function formatNotes(record) {
  const notes = new Set();
  if (record.reason) {
    formatList(record.reason.split('|')).forEach((note) => notes.add(note));
  }
  const rawNotes = Array.isArray(record.raw?.notes) ? record.raw.notes : [];
  rawNotes.forEach((note) => {
    if (typeof note === 'string') notes.add(note);
  });
  return Array.from(notes);
}

function formatProvenance(provenance = {}) {
  return Object.entries(provenance).map(([field, provider]) => `${field}: ${provider}`);
}

function buildBodyPreview(body) {
  if (!body) return null;
  const normalised = body.replace(/\s+/g, ' ').trim();
  if (!normalised) return null;
  const maxLength = 600;
  if (normalised.length <= maxLength) return normalised;
  const truncated = normalised.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const preview = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${preview}...`;
}

function renderRecordSection(record, index) {
  const lines = [];
  const headingTitle = record.title || `Article ${index + 1}`;
  lines.push(`### ${index + 1}. ${headingTitle}`);

  const metaItems = [
    `**Link:** ${record.url}`,
    `**Confidence:** ${record.confidence.emoji} ${record.confidence.score}% (${record.confidence.band})`,
    record.provider ? `**Primary Provider:** ${record.provider}` : null,
  ];

  const providersUsed = formatList(record.providersUsed || []);
  if (providersUsed.length > 0) {
    metaItems.push(`**Providers Used:** ${providersUsed.join(', ')}`);
  }

  lines.push(metaItems.filter(Boolean).join('  \n'));

  const notes = formatNotes(record);
  if (notes.length > 0) {
    lines.push('**Notes**');
    notes.forEach((note) => {
      lines.push(`- ${note}`);
    });
  }

  if (record.redacted === true) {
    lines.push('_Record redacted due to low confidence; metadata withheld._');
    return lines.join('\n');
  }

  const metadataLines = [];
  if (record.description) metadataLines.push(`- **Summary:** ${record.description}`);
  if (record.author) metadataLines.push(`- **Author:** ${record.author}`);
  if (record.published_on) metadataLines.push(`- **Publication:** ${record.published_on}`);
  if (record.publication_date) metadataLines.push(`- **Published:** ${record.publication_date}`);
  if (record.word_count) metadataLines.push(`- **Word Count:** ${record.word_count}`);
  if (record.language) metadataLines.push(`- **Language:** ${record.language}`);

  const tagList = formatList(record.tags || []);
  if (tagList.length > 0) {
    metadataLines.push(`- **Tags:** ${tagList.join(', ')}`);
  }

  const provenance = formatProvenance(record.provenance || {});
  if (provenance.length > 0) {
    metadataLines.push(`- **Provenance:** ${provenance.join(', ')}`);
  }

  if (metadataLines.length > 0) {
    lines.push('**Metadata**');
    lines.push(...metadataLines);
  }

  const bodyPreview = buildBodyPreview(record.body);
  if (bodyPreview) {
    lines.push('**Body Preview**');
    lines.push(`> ${bodyPreview}`);
  }

  return lines.join('\n');
}

function renderSummary(records, metadata = {}) {
  const summaryLines = ['## Run Summary'];
  summaryLines.push(`- **Processed Links:** ${records.length}`);
  if (metadata.startedAt) summaryLines.push(`- **Started At:** ${metadata.startedAt}`);
  if (metadata.durationMs) summaryLines.push(`- **Duration:** ${metadata.durationMs} ms`);
  if (metadata.providersUsed && metadata.providersUsed.length > 0) {
    summaryLines.push(`- **Providers Used:** ${metadata.providersUsed.join(', ')}`);
  }
  return summaryLines.join('\n');
}

function renderMarkdown(records, metadata = {}) {
  const sections = ['# Digest Review', renderSummary(records, metadata), '## Articles'];
  records.forEach((record, index) => {
    sections.push(renderRecordSection(record, index));
  });
  return sections.join('\n\n');
}

module.exports = { renderMarkdown };
