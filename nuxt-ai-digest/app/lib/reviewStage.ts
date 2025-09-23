export const REVIEW_STAGE_ORDER = [
  'analyst_review',
  'awaiting_manager',
  'needs_revision',
  'shortlisted',
  'saved_for_later',
] as const

export type ReviewStageValue = (typeof REVIEW_STAGE_ORDER)[number]

export const REVIEW_STAGE_LABELS: Record<ReviewStageValue, string> = {
  analyst_review: 'Analyst review',
  awaiting_manager: 'Awaiting manager',
  needs_revision: 'Needs revision',
  shortlisted: 'Shortlisted',
  saved_for_later: 'Saved for later',
}

export const REVIEW_STAGE_BADGE_CLASSES: Record<ReviewStageValue, string> = {
  analyst_review: 'bg-slate-100 text-slate-700 border border-slate-200',
  awaiting_manager: 'bg-sky-100 text-sky-800 border border-sky-200',
  needs_revision: 'bg-rose-100 text-rose-800 border border-rose-200',
  shortlisted: 'bg-amber-100 text-amber-900 border border-amber-300',
  saved_for_later: 'bg-violet-100 text-violet-800 border border-violet-200',
}

type NormalizeOptions = {
  shortlisted?: boolean
}

export function normalizeReviewStage(
  reviewStage?: string | null,
  options: NormalizeOptions = {},
): ReviewStageValue {
  if (reviewStage && (REVIEW_STAGE_ORDER as readonly string[]).includes(reviewStage)) {
    return reviewStage as ReviewStageValue
  }

  if (options.shortlisted) {
    return 'shortlisted'
  }

  return 'analyst_review'
}

type StageCarrier = {
  reviewStage?: string | null
  shortlisted?: boolean
}

export function ensureReviewStage<T extends StageCarrier>(record: T): T & {
  reviewStage: ReviewStageValue
  shortlisted: boolean
} {
  const shortlisted = Boolean(record.shortlisted)
  const reviewStage = normalizeReviewStage(record.reviewStage, { shortlisted })

  return {
    ...record,
    shortlisted,
    reviewStage,
  }
}
