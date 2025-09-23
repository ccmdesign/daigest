import { saveDigest } from '../../utils/digestStore'
import { resolveActor } from '../../utils/identity'

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

  const actor = resolveActor(event, body?.metadata?.actor)
  const shortlistedTotal = Number(summary?.shortlistedTotal) || 0

  const createdAt = new Date().toISOString()
  const digest = await saveDigest({
    createdAt,
    summary: {
      total: Number(summary.total) || records.length,
      durationMs: Number(summary.durationMs) || 0,
      shortlistedTotal,
    },
    records,
    metadata: {
      actor,
      createdVia:
        typeof body?.metadata?.createdVia === 'string'
          ? body.metadata.createdVia.slice(0, 60)
          : 'ui',
      note:
        typeof body?.metadata?.note === 'string'
          ? body.metadata.note.slice(0, 240)
          : undefined,
    },
  })

  return {
    success: true,
    data: digest,
  }
})
