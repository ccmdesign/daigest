function scoreConfidence(record, context = {}) {
  const {
    providersUsed = [],
    notes = [],
    providerOutcomes = [],
    expectedLanguage,
  } = context;

  let score = 35;

  if (record.title) score += 15;
  else score -= 12;

  if (record.description) score += 10;
  else score -= 8;

  if (record.author) score += 6;
  if (record.published_on) score += 8;
  if (record.publication_date) score += 10;

  if (record.body) score += 12;
  else score -= 20;

  const wordCount = record.word_count || 0;
  if (wordCount >= 800) score += 12;
  else if (wordCount >= 400) score += 8;
  else if (wordCount >= 200) score += 5;
  else if (wordCount > 50) score -= 5;
  else if (wordCount > 0) score -= 12;

  if (record.tags && record.tags.length >= 3) score += 4;

  const targetLanguage = expectedLanguage || 'eng';
  if (record.language && record.language !== targetLanguage) {
    score -= 10;
  }

  if (providersUsed.length > 1) {
    score += Math.min(8, providersUsed.length * 2);
  }

  providerOutcomes.forEach((outcome) => {
    if (!outcome || !outcome.status) return;
    if (outcome.status === 'error' || outcome.status === 'exception') {
      score -= 6;
    }
    if (outcome.status === 'timeout') {
      score -= 8;
    }
  });

  notes.forEach((note) => {
    if (typeof note !== 'string') return;
    if (/failed|error|blocked|timeout/i.test(note)) {
      score -= 4;
    }
  });

  const boundedScore = Math.max(5, Math.min(95, Math.round(score)));
  let band = 'yellow';
  if (boundedScore >= 80) band = 'green';
  else if (boundedScore < 45) band = 'red';

  const emoji = band === 'green' ? '🟢' : band === 'yellow' ? '🟡' : '🔴';

  return {
    score: boundedScore,
    band,
    emoji,
  };
}

function shouldRedactFields(confidence) {
  return confidence.band === 'red';
}

module.exports = { scoreConfidence, shouldRedactFields };
