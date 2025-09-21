import { computed, ref, shallowRef } from 'vue'
import type { ArticleRecord, ProcessingOptions } from '~/types'

type StatusState = 'pending' | 'processing' | 'done' | 'error'

interface StatusItem {
  index: number
  url: string
  state: StatusState
  message?: string
}

interface ProcessSummary {
  total: number
  durationMs: number
}

export function useDigestProcessor() {
  const results = ref<ArticleRecord[]>([])
  const statusItems = ref<StatusItem[]>([])
  const isProcessing = ref(false)
  const errorMessage = ref('')
  const summary = ref<ProcessSummary>({ total: 0, durationMs: 0 })
  const sourceRef = shallowRef<EventSource | null>(null)

  const processedCount = computed(() =>
    statusItems.value.filter((item) => item.state === 'done').length,
  )

  function reset() {
    closeStream()
    results.value = []
    statusItems.value = []
    summary.value = { total: 0, durationMs: 0 }
    errorMessage.value = ''
    isProcessing.value = false
  }

  function clearError() {
    errorMessage.value = ''
  }

  function closeStream() {
    if (sourceRef.value) {
      sourceRef.value.close()
      sourceRef.value = null
    }
  }

  function updateStatus(index: number, updates: Partial<StatusItem>) {
    statusItems.value = statusItems.value.map((item) =>
      item.index === index ? { ...item, ...updates } : item,
    )
  }

  async function fallbackProcess(urls: string[], options: ProcessingOptions) {
    const nuxtApp = useNuxtApp()

    try {
      const response = await nuxtApp.$fetch('/api/process', {
        method: 'POST',
        body: {
          urls,
          options,
        },
      })

      const records = (response as any)?.data?.records || []
      results.value = records
      summary.value = {
        total: urls.length,
        durationMs: (response as any)?.data?.metadata?.durationMs || 0,
      }

      statusItems.value = urls.map((url, index) => {
        const record = records[index]
        return {
          index,
          url,
          state: record ? 'done' : 'error',
          message: record ? undefined : 'No data returned.',
        }
      })
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Processing failed'
      errorMessage.value = message
      statusItems.value = urls.map((url, index) => ({
        index,
        url,
        state: 'error',
        message,
      }))
    } finally {
      isProcessing.value = false
    }
  }

  async function startProcessing(urls: string[], options: ProcessingOptions = {}) {
    if (!urls.length) return

    reset()
    isProcessing.value = true
    summary.value = { total: urls.length, durationMs: 0 }
    statusItems.value = urls.map((url, index) => ({ index, url, state: 'pending' }))

    if (!process.client || typeof window.EventSource === 'undefined') {
      await fallbackProcess(urls, options)
      return
    }

    const params = new URLSearchParams()
    urls.forEach((url) => params.append('urls', url))
    if (options.disableBrowser) params.set('disableBrowser', '1')
    if (options.expectedLanguage) params.set('expectedLanguage', options.expectedLanguage)

    const endpoint = `/api/process-stream?${params.toString()}`
    const eventSource = new EventSource(endpoint)
    sourceRef.value = eventSource

    eventSource.onmessage = (event) => {
      if (!event.data) return
      try {
        const payload = JSON.parse(event.data)
        handleStreamPayload(payload)
      } catch (error) {
        console.warn('Failed to parse stream payload', event.data)
      }
    }

    eventSource.onerror = () => {
      if (!errorMessage.value) {
        errorMessage.value = 'Connection lost while processing URLs.'
      }
      closeStream()
      isProcessing.value = false
    }
  }

  function handleStreamPayload(payload: any) {
    switch (payload.status) {
      case 'start': {
        summary.value = { total: payload.total || 0, durationMs: 0 }
        break
      }
      case 'processing': {
        if (typeof payload.index === 'number') {
          updateStatus(payload.index, { state: 'processing', message: undefined })
        }
        break
      }
      case 'record': {
        if (typeof payload.index === 'number' && payload.record) {
          results.value[payload.index] = payload.record as ArticleRecord
          results.value = [...results.value]
          updateStatus(payload.index, { state: 'done', message: undefined })
        }
        break
      }
      case 'error': {
        if (typeof payload.index === 'number') {
          const message = payload.message || 'Processing failed'
          updateStatus(payload.index, { state: 'error', message })
          errorMessage.value = errorMessage.value || message
        }
        break
      }
      case 'complete': {
        summary.value = {
          total: payload.total || summary.value.total,
          durationMs: payload.durationMs || 0,
        }
        closeStream()
        isProcessing.value = false
        break
      }
      default:
        break
    }
  }

  function cancel() {
    closeStream()
    isProcessing.value = false
  }

  return {
    results,
    statusItems,
    isProcessing,
    error: errorMessage,
    summary,
    processedCount,
    startProcessing,
    cancel,
    reset,
    clearError,
  }
}
