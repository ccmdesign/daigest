import { saveDigest } from '../../utils/digestStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { records, summary } = body || {}

  if (!Array.isArray(records) || records.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'records array is required',
    })
  }

  if (!summary || typeof summary.total !== 'number') {
    throw createError({
      statusCode: 400,
      statusMessage: 'summary is required',
    })
  }

  const createdAt = new Date().toISOString()
  const digest = await saveDigest({
    createdAt,
    summary: {
      total: Number(summary.total) || records.length,
      durationMs: Number(summary.durationMs) || 0,
    },
    records,
  })

  return {
    success: true,
    data: digest,
  }
})
