import type { ArticleReviewStage } from './storage/types'

export const REVIEW_STAGE_VALUES: ArticleReviewStage[] = [
  'analyst_review',
  'awaiting_manager',
  'needs_revision',
  'shortlisted',
  'saved_for_later',
]

export function isReviewStage(value: unknown): value is ArticleReviewStage {
  return typeof value === 'string' && (REVIEW_STAGE_VALUES as readonly string[]).includes(value)
}

export function normalizeReviewStage(
  value: unknown,
  options: { shortlisted?: boolean } = {},
): ArticleReviewStage {
  if (isReviewStage(value)) {
    return value
  }

  if (options.shortlisted) {
    return 'shortlisted'
  }

  return 'analyst_review'
}
