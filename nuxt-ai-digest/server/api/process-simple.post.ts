import { processUrls } from '../utils/pipeline/processor'
import type { ProcessingOptions } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { urls, options = {} } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URLs array is required',
      })
    }

    const validUrls = urls.filter((url: any) => {
      if (typeof url !== 'string') return false
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })

    if (!validUrls.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid URLs provided',
      })
    }

    const processingOptions: ProcessingOptions = {
      disableBrowser: options.disableBrowser ?? true,
      expectedLanguage: options.expectedLanguage || 'en',
      writeArtifacts: false,
    }

    const result = await processUrls(validUrls, processingOptions)

    return {
      success: true,
      data: result,
      processedUrls: validUrls.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error('API processing error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Processing failed',
    })
  }
})
