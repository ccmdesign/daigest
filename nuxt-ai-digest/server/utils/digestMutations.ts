import { normalizeReviewStage } from './reviewStage'
import type { PersistedDigest, PersistedArticleRecord, ArticleReviewStage } from './storage/types'

interface UpdateReviewStageInput {
  recordId: string
  reviewStage?: ArticleReviewStage | string
  shortlisted?: boolean
  timestamp?: string
}

interface UpdateResult {
  digest: PersistedDigest
  record: PersistedArticleRecord
}

export function applyReviewStageUpdate(current: PersistedDigest, input: UpdateReviewStageInput): UpdateResult {
  const { recordId, reviewStage, shortlisted, timestamp } = input
  const updatedAt = timestamp ?? new Date().toISOString()

  let updatedRecord: PersistedArticleRecord | null = null
  let recordFound = false

  const records = current.records.map((record) => {
    if (record.id !== recordId) {
      return record
    }

    recordFound = true
    const nextShortlisted = typeof shortlisted === 'boolean' ? shortlisted : Boolean(record.shortlisted)
    let nextReviewStage: PersistedArticleRecord['reviewStage']

    if (reviewStage !== undefined) {
      nextReviewStage = normalizeReviewStage(reviewStage, { shortlisted: nextShortlisted })
    } else if (nextShortlisted) {
      nextReviewStage = 'shortlisted'
    } else if (record.reviewStage === 'shortlisted') {
      nextReviewStage = 'analyst_review'
    } else {
      nextReviewStage = normalizeReviewStage(record.reviewStage, { shortlisted: nextShortlisted })
    }

    if (record.reviewStage === nextReviewStage && Boolean(record.shortlisted) === nextShortlisted) {
      updatedRecord = {
        ...record,
        shortlisted: nextShortlisted,
        reviewStage: nextReviewStage,
        lastReviewedAt: updatedAt,
      }
      return updatedRecord
    }

    updatedRecord = {
      ...record,
      shortlisted: nextShortlisted,
      reviewStage: nextReviewStage,
      lastReviewedAt: updatedAt,
    }

    return updatedRecord
  })

  if (!recordFound || !updatedRecord) {
    throw new Error('Record not found')
  }

  const shortlistedTotal = records.filter((record) => Boolean(record.shortlisted)).length

  return {
    digest: {
      ...current,
      records,
      summary: {
        ...current.summary,
        shortlistedTotal,
      },
    },
    record: updatedRecord,
  }
}
