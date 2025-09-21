import { processUrls } from '../utils/pipeline/processor'
import type { ProcessingOptions } from '~/types'

interface StreamPayload {
  status: 'start' | 'processing' | 'record' | 'error' | 'complete'
  index?: number
  url?: string
  total?: number
  durationMs?: number
  record?: any
  message?: string
}

function writeEvent(res: any, payload: StreamPayload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const urlsParam = query.urls
  let urls: string[] = []

  if (Array.isArray(urlsParam)) {
    urls = urlsParam as string[]
  } else if (typeof urlsParam === 'string') {
    urls = urlsParam.split(',').map((value) => value.trim()).filter(Boolean)
  }

  if (!urls.length) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'At least one URL is required',
    }
  }

  const disableBrowser = query.disableBrowser === '1'
  const expectedLanguage = typeof query.expectedLanguage === 'string' ? query.expectedLanguage : undefined

  const res = event.node.res
  const startedAt = Date.now()
  let isClosed = false

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const closeHandler = () => {
    isClosed = true
  }

  event.node.req.on('close', closeHandler)

  writeEvent(res, { status: 'start', total: urls.length })

  const processingOptions: ProcessingOptions = {
    disableBrowser,
    expectedLanguage,
    writeArtifacts: false,
  }

  for (let index = 0; index < urls.length; index += 1) {
    if (isClosed) break
    const url = urls[index]

    writeEvent(res, { status: 'processing', index, url })

    try {
      const result = await processUrls([url], processingOptions)
      const record = result.records[0]
      writeEvent(res, { status: 'record', index, url, record })
    } catch (error: any) {
      const message = error?.statusMessage || error?.message || 'Processing failed'
      writeEvent(res, { status: 'error', index, url, message })
    }
  }

  if (!isClosed) {
    const durationMs = Date.now() - startedAt
    writeEvent(res, {
      status: 'complete',
      total: urls.length,
      durationMs,
    })
  }

  if (!isClosed && !res.writableEnded) {
    res.end()
  }
  event.node.req.off('close', closeHandler)
})
