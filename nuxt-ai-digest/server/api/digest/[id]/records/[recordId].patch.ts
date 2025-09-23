import { updateDigest } from '../../../../utils/digestStore'
import { applyReviewStageUpdate } from '../../../../utils/digestMutations'
import { isReviewStage, normalizeReviewStage } from '../../../../utils/reviewStage'

export default defineEventHandler(async (event) => {
  const params = event.context.params || {}
  const digestId = params.id
  const recordId = params.recordId

  if (typeof digestId !== 'string' || !digestId.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Digest id is required',
    })
  }

  if (typeof recordId !== 'string' || !recordId.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Record id is required',
    })
  }

  const body = await readBody(event)
  const requestedStage = body?.reviewStage
  const requestedShortlisted = body?.shortlisted

  if (requestedStage !== undefined && !isReviewStage(requestedStage)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid review stage provided',
    })
  }

  if (requestedShortlisted !== undefined && typeof requestedShortlisted !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'shortlisted must be a boolean when provided',
    })
  }

  const timestamp = new Date().toISOString()
  let updatedRecord: ReturnType<typeof applyReviewStageUpdate>['record'] | null = null

  try {
    const updatedDigest = await updateDigest(digestId, (current) => {
      const { digest, record } = applyReviewStageUpdate(current, {
        recordId,
        reviewStage: requestedStage,
        shortlisted: requestedShortlisted,
        timestamp,
      })
      updatedRecord = record
      return digest
    })

    if (!updatedRecord) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Record update failed',
      })
    }

    const normalizedStage = normalizeReviewStage(updatedRecord.reviewStage, {
      shortlisted: updatedRecord.shortlisted,
    })

    return {
      success: true,
      data: {
        digestId,
        record: {
          ...updatedRecord,
          reviewStage: normalizedStage,
        },
      },
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    if (error instanceof Error && error.message === 'Record not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Record not found',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to update record',
    })
  }
})
