import { processUrls } from '../utils/pipeline/processor'
import type { ProcessingOptions } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event)
    const { urls, options = {} } = body
    
    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URLs array is required'
      })
    }
    
    // Validate URLs
    const validUrls = urls.filter((url: any) => {
      if (typeof url !== 'string') return false
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })
    
    if (validUrls.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid URLs provided'
      })
    }
    
    // Process the URLs
    const processingOptions: ProcessingOptions = {
      disableBrowser: options.disableBrowser || false,
      expectedLanguage: options.expectedLanguage || 'en',
      writeArtifacts: false, // Don't write files in serverless
    }
    
    console.log(`Processing ${validUrls.length} URLs`)
    const result = await processUrls(validUrls, processingOptions)
    
    // Return the processed results
    return {
      success: true,
      data: result,
      processedUrls: validUrls.length,
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('API processing error:', error)
    
    // Handle Nuxt errors
    if (error.statusCode) {
      throw error
    }
    
    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Processing failed'
    })
  }
})
