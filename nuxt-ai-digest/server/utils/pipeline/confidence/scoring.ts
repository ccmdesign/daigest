import type { ArticleRecord } from '~/types'

const FIELD_WEIGHTS = {
  title: 20,
  description: 15,
  author: 15,
  published_on: 10,
  publication_date: 10,
  body: 25,
  word_count: 5,
}

const MINIMUM_BODY_LENGTH = 200
const PREFERRED_WORD_COUNT = 300

export function scoreConfidence(
  fields: Partial<ArticleRecord>,
  context: {
    provenance?: Record<string, string>
    providersUsed?: string[]
    notes?: string[]
    providerOutcomes?: Array<{ name: string; status: string }>
    expectedLanguage?: string
  } = {}
): number {
  let score = 0
  let maxScore = 0

  // Score based on field presence and quality
  Object.entries(FIELD_WEIGHTS).forEach(([field, weight]) => {
    maxScore += weight
    const value = fields[field as keyof ArticleRecord]
    
    if (value) {
      if (field === 'body') {
        const bodyLength = typeof value === 'string' ? value.length : 0
        if (bodyLength >= MINIMUM_BODY_LENGTH) {
          score += weight
        } else if (bodyLength > 0) {
          score += weight * 0.5 // Partial credit for short body
        }
      } else if (field === 'word_count') {
        const wordCount = typeof value === 'number' ? value : 0
        if (wordCount >= PREFERRED_WORD_COUNT) {
          score += weight
        } else if (wordCount > 0) {
          score += weight * (wordCount / PREFERRED_WORD_COUNT)
        }
      } else {
        // Standard field presence
        const stringValue = String(value).trim()
        if (stringValue.length > 0) {
          score += weight
        }
      }
    }
  })

  // Bonus for multiple providers agreeing
  const { provenance = {} } = context
  const uniqueProviders = new Set(Object.values(provenance))
  if (uniqueProviders.size > 1) {
    score += 5 // Bonus for cross-validation
  }

  // Penalty for failed providers
  const { providerOutcomes = [] } = context
  const failedProviders = providerOutcomes.filter(outcome => 
    outcome.status === 'error' || outcome.status === 'exception'
  )
  if (failedProviders.length > 0) {
    score -= failedProviders.length * 2
  }

  // Penalty for concerning notes
  const { notes = [] } = context
  const concerningNotes = notes.filter(note => 
    note.toLowerCase().includes('failed') ||
    note.toLowerCase().includes('error') ||
    note.toLowerCase().includes('blocked')
  )
  if (concerningNotes.length > 0) {
    score -= concerningNotes.length * 3
  }

  // Language mismatch penalty
  if (context.expectedLanguage && fields.language) {
    if (fields.language !== context.expectedLanguage) {
      score -= 10
    }
  }

  // Ensure score is within bounds
  const percentage = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)))
  return percentage
}

export function shouldRedactFields(confidence: number): boolean {
  return confidence < 40 // Red tier threshold
}

export function getConfidenceTier(confidence: number): { tier: string; color: string } {
  if (confidence >= 80) return { tier: 'high', color: 'green' }
  if (confidence >= 40) return { tier: 'medium', color: 'yellow' }
  return { tier: 'low', color: 'red' }
}

export function getConfidenceReason(confidence: number, fields: Partial<ArticleRecord>): string {
  const tier = getConfidenceTier(confidence)
  
  const missingFields = []
  if (!fields.title) missingFields.push('title')
  if (!fields.description) missingFields.push('description')
  if (!fields.author) missingFields.push('author')
  if (!fields.body || (typeof fields.body === 'string' && fields.body.length < MINIMUM_BODY_LENGTH)) {
    missingFields.push('body')
  }
  
  if (tier.tier === 'low') {
    return `Low confidence (${confidence}%): ${missingFields.length > 0 ? `Missing ${missingFields.join(', ')}` : 'Quality issues detected'}`
  }
  
  if (tier.tier === 'medium') {
    return `Medium confidence (${confidence}%): ${missingFields.length > 0 ? `Some fields missing: ${missingFields.join(', ')}` : 'Good quality with minor issues'}`
  }
  
  return `High confidence (${confidence}%): All key fields present`
}
