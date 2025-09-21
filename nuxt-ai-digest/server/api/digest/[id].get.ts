import { getDigest } from '../../utils/digestStore'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params || {}
  if (!id || typeof id !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Digest id is required',
    })
  }

  const digest = await getDigest(id)
  if (!digest) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Digest not found',
    })
  }

  return {
    success: true,
    data: digest,
  }
})
