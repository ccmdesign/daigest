<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div
      v-if="toastState.visible"
      :class="['fixed right-4 top-4 z-50 rounded-md border px-4 py-2 shadow-md text-sm transition-opacity', toastVariantClass]"
    >
      {{ toastState.message }}
    </div>

    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        AI Link Digest
      </h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Paste article links below and get enriched metadata, summaries, and confidence scoring for each link.
      </p>
    </div>

    <!-- URL Input Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div class="mb-4">
        <label for="urls" class="block text-sm font-medium text-gray-700 mb-2">
          Article Links
        </label>
        <Textarea
          id="urls"
          v-model="urlInput"
          placeholder="Paste article URLs here (one per line or comma-separated)&#10;https://example.com/article1&#10;https://example.com/article2"
          rows="6"
          class="w-full min-h-32"
          :disabled="isProcessing"
        />
      </div>
      
      <!-- URL Validation Display -->
      <div v-if="detectedUrls.length > 0" class="mb-4">
        <p class="text-sm text-gray-600 mb-2">
          Detected {{ detectedUrls.length }} URL{{ detectedUrls.length === 1 ? '' : 's' }}:
        </p>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="(url, index) in detectedUrls.slice(0, 5)"
            :key="index"
            variant="secondary"
            class="text-xs"
          >
            {{ getDomainFromUrl(url) }}
          </Badge>
          <Badge
            v-if="detectedUrls.length > 5"
            variant="outline"
            class="text-xs"
          >
            +{{ detectedUrls.length - 5 }} more
          </Badge>
        </div>
      </div>

      <!-- Process Button -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button
            @click="processUrls"
            :disabled="detectedUrls.length === 0 || isProcessing"
            size="lg"
            class="px-6 py-3"
          >
            {{ isProcessing ? 'Processing...' : `Process ${detectedUrls.length} URL${detectedUrls.length === 1 ? '' : 's'}` }}
          </Button>
          
          <Button
            v-if="completedRecords.length > 0"
            @click="clearResults"
            variant="ghost"
          >
            Clear Results
          </Button>
        </div>
        
        <div v-if="isProcessing" class="text-sm text-gray-500">
          This may take up to 30 seconds...
        </div>
      </div>
    </div>

    <!-- Processing Status -->
    <div v-if="isProcessing" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            <p class="text-blue-800 font-medium">Processing articles...</p>
            <p class="text-blue-600 text-sm">
              {{ processedCount }} / {{ statusItems.length }} completed
            </p>
          </div>
        </div>

        <div v-if="statusItems.length" class="space-y-2">
          <div
            v-for="item in statusItems"
            :key="item.index"
            class="flex flex-col gap-1 rounded-md border border-blue-100/60 bg-blue-100/30 p-2"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="truncate text-sm text-blue-900">{{ item.url }}</p>
              <Badge :class="statusBadgeClass(item.state)" class="text-xs font-medium">
                {{ statusBadgeLabel(item.state) }}
              </Badge>
            </div>
            <p v-if="item.message" class="text-xs text-blue-800">{{ item.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="processorError" class="mb-8 rounded-lg border border-red-200 bg-red-50 p-4">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-sm font-medium text-red-800">Processing Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ processorError }}</p>
        </div>
        <button @click="clearError()" class="text-red-400 hover:text-red-600">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="completedRecords.length > 0" class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">
          Results ({{ completedRecords.length }})
        </h2>
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" class="bg-green-100 text-green-800 border-green-200">{{ highConfidenceCount }} High</Badge>
          <Badge variant="secondary" class="bg-yellow-100 text-yellow-800 border-yellow-200">{{ mediumConfidenceCount }} Medium</Badge>
          <Badge variant="secondary" class="bg-red-100 text-red-800 border-red-200">{{ lowConfidenceCount }} Low</Badge>
        </div>
      </div>

      <p v-if="summary.durationMs" class="text-sm text-muted-foreground">
        Completed in {{ formatDuration(summary.durationMs) }}
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" @click="downloadJson">
          Download JSON
        </Button>
        <Button size="sm" variant="outline" @click="downloadMarkdown">
          Download Markdown
        </Button>
        <Button
          size="sm"
          variant="outline"
          :disabled="shareState.isSharing"
          @click="createShareLink"
        >
          {{ shareState.isSharing ? 'Creating link…' : 'Create Share Link' }}
        </Button>
      </div>

      <div v-if="shareState.link" class="flex flex-wrap items-center gap-3 rounded-md border border-muted bg-muted/30 p-3 text-sm">
        <span class="font-medium">Share URL:</span>
        <a :href="shareState.link" target="_blank" rel="noopener" class="break-all text-primary hover:underline">
          {{ shareState.link }}
        </a>
        <Button size="sm" variant="ghost" @click="copyShareLink">
          Copy Link
        </Button>
      </div>

      <p v-if="shareState.error" class="text-sm text-red-600">
        {{ shareState.error }}
      </p>

      <!-- Article Cards -->
      <div class="flex flex-col gap-6">
        <ArticleCard
          v-for="(result, index) in completedRecords"
          :key="index"
          :article="result"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isProcessing" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-gray-400 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5A1.125 1.125 0 0110.5 9h-3A1.125 1.125 0 016.5 7.875v1.5A1.125 1.125 0 006.375 10.5H6a1.875 1.875 0 000 3.75h.375a1.125 1.125 0 001.125 1.125v1.5a1.125 1.125 0 001.125 1.125h4.5A1.125 1.125 0 0014.625 15H15a1.875 1.875 0 000-3.75H14.625z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No articles processed yet</h3>
      <p class="text-gray-500">Paste some article URLs above to get started</p>
    </div>

    <div v-if="historyEntries.length" class="mt-12">
      <h2 class="text-xl font-semibold text-gray-900">Recent Runs</h2>
      <p class="text-sm text-muted-foreground mb-3">
        Local-only history. Share links remain active until the server restarts.
      </p>
      <div class="space-y-2">
        <div
          v-for="entry in historyEntries"
          :key="entry.runId"
          class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-muted bg-muted/20 p-3 text-sm"
        >
          <div class="space-y-1">
            <p class="font-medium">{{ new Date(entry.createdAt).toLocaleString() }}</p>
            <p class="text-muted-foreground">{{ entry.total }} URLs processed</p>
          </div>
          <div class="flex items-center gap-2">
            <Badge v-if="entry.shareId" variant="outline" class="text-xs">Shared</Badge>
            <a
              v-if="entry.shareLink"
              :href="entry.shareLink"
              target="_blank"
              rel="noopener"
              class="text-primary hover:underline"
            >
              Open Link
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { ArticleRecord } from '~/types'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Textarea } from '~/components/ui/textarea'
import { useDigestProcessor } from '~/composables/useDigestProcessor'

// Page metadata
useSeoMeta({
  title: 'AI Link Digest - Process Article Links',
  description: 'Process article links and get enriched metadata with confidence scoring'
})

// Reactive state
const urlInput = ref('')

const {
  results,
  statusItems,
  isProcessing,
  error: processorError,
  summary,
  processedCount,
  startProcessing,
  reset,
  clearError,
} = useDigestProcessor()

type HistoryEntry = {
  runId: string
  createdAt: string
  total: number
  shareId?: string
  shareLink?: string
}

const digestHistory = useState<HistoryEntry[]>(
  'digest-history',
  () => [],
)

const historyEntries = computed(() => digestHistory.value)
const currentRunId = ref('')
const hasRecordedHistory = ref(false)

const shareState = reactive({
  isSharing: false,
  link: '',
  digestId: '',
  error: '',
})

const toastState = reactive({
  visible: false,
  message: '',
  variant: 'info' as 'info' | 'success' | 'error',
  timeoutId: 0 as ReturnType<typeof setTimeout> | 0,
})

const toastVariantClass = computed(() => {
  switch (toastState.variant) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800'
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-800'
  }
})

// Computed properties
const detectedUrls = computed(() => {
  if (!urlInput.value.trim()) return []
  
  const urlRegex = /https?:\/\/[^\s,\n]+/g
  const matches = urlInput.value.match(urlRegex) || []
  return [...new Set(matches)] // Remove duplicates
})

const completedRecords = computed(() => 
  results.value.filter((record): record is ArticleRecord => Boolean(record))
)

const highConfidenceCount = computed(() => 
  completedRecords.value.filter(r => r.confidence >= 80).length
)

const mediumConfidenceCount = computed(() => 
  completedRecords.value.filter(r => r.confidence >= 40 && r.confidence < 80).length
)

const lowConfidenceCount = computed(() => 
  completedRecords.value.filter(r => r.confidence < 40).length
)

// Methods
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Invalid URL'
  }
}

async function processUrls() {
  if (detectedUrls.value.length === 0 || isProcessing.value) return

  startNewRun()
  await startProcessing(detectedUrls.value, {
    disableBrowser: false,
    expectedLanguage: 'en'
  })
}

function clearResults() {
  reset()
  urlInput.value = ''
  resetShareState()
}

function startNewRun() {
  currentRunId.value = generateId()
  hasRecordedHistory.value = false
  resetShareState()
}

function statusBadgeLabel(state: 'pending' | 'processing' | 'done' | 'error'): string {
  switch (state) {
    case 'processing':
      return 'Processing'
    case 'done':
      return 'Completed'
    case 'error':
      return 'Error'
    default:
      return 'Queued'
  }
}

function statusBadgeClass(state: 'pending' | 'processing' | 'done' | 'error'): string {
  switch (state) {
    case 'processing':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'done':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'error':
      return 'bg-red-100 text-red-800 border border-red-200'
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

function formatDuration(ms: number): string {
  if (!ms) return ''
  const seconds = Math.round(ms / 100) / 10
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round((seconds % 60) * 10) / 10
  return `${minutes}m ${remaining.toFixed(1)}s`
}

function generateId(): string {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2, 10)
}

function recordHistoryEntry() {
  if (!completedRecords.value.length) return
  const entry: HistoryEntry = {
    runId: currentRunId.value,
    createdAt: new Date().toISOString(),
    total: completedRecords.value.length,
    shareId: shareState.digestId || undefined,
    shareLink: shareState.link || undefined,
  }
  digestHistory.value = [entry, ...digestHistory.value].slice(0, 10)
}

function updateHistoryWithShare(digestId: string, link: string) {
  digestHistory.value = digestHistory.value.map((entry) => {
    if (entry.runId === currentRunId.value) {
      return { ...entry, shareId: digestId, shareLink: link }
    }
    return entry
  })
}

function resetShareState() {
  shareState.isSharing = false
  shareState.link = ''
  shareState.digestId = ''
  shareState.error = ''
}

function downloadJson() {
  if (!completedRecords.value.length || !process.client) return
  const payload = {
    summary: {
      ...summary.value,
      total: completedRecords.value.length,
    },
    records: completedRecords.value,
  }
  downloadFile('digest.json', JSON.stringify(payload, null, 2), 'application/json')
}

function downloadMarkdown() {
  if (!completedRecords.value.length || !process.client) return
  const markdown = buildMarkdown()
  downloadFile('digest.md', markdown, 'text/markdown')
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function buildMarkdown(): string {
  const lines: string[] = []
  lines.push('# AI Digest')
  lines.push('')
  lines.push(`Processed ${completedRecords.value.length} URLs on ${new Date().toLocaleString()}`)
  lines.push('')

  completedRecords.value.forEach((record, index) => {
    lines.push(`## ${index + 1}. ${record.title || record.url}`)
    lines.push(`- URL: ${record.url}`)
    if (record.author) lines.push(`- Author: ${record.author}`)
    if (record.publisher) lines.push(`- Publisher: ${record.publisher}`)
    if (record.published_on) lines.push(`- Published: ${record.published_on}`)
    lines.push(`- Confidence: ${record.confidence}%`)
    if (record.tags?.length) lines.push(`- Tags: ${record.tags.join(', ')}`)
    if (record.description) {
      lines.push('')
      lines.push(record.description)
    }
    lines.push('')
  })

  return lines.join('\n').trim()
}

async function createShareLink() {
  if (!completedRecords.value.length || shareState.isSharing) return
  shareState.isSharing = true
  shareState.error = ''

  try {
    const response = await $fetch('/api/digest', {
      method: 'POST',
      body: {
        records: completedRecords.value,
        summary: {
          total: completedRecords.value.length,
          durationMs: summary.value.durationMs || 0,
        },
      },
    })

    const digest = (response as any)?.data
    if (digest?.id) {
      shareState.digestId = digest.id
      if (process.client) {
        const origin = window.location.origin
        shareState.link = `${origin}/digest/${digest.id}`
        showToast('Share link created', 'success')
      }
      updateHistoryWithShare(digest.id, shareState.link)
    }
  } catch (error: any) {
    shareState.error = error?.data?.message || error?.message || 'Unable to create share link'
    showToast(shareState.error, 'error')
  } finally {
    shareState.isSharing = false
  }
}

async function copyShareLink() {
  if (!shareState.link || !process.client || !navigator?.clipboard) return
  try {
    await navigator.clipboard.writeText(shareState.link)
    showToast('Share link copied', 'success')
  } catch (error) {
    console.warn('Unable to copy share link', error)
    showToast('Unable to copy link', 'error')
  }
}

watch(isProcessing, (value) => {
  if (value) {
    hasRecordedHistory.value = false
  }
})

watch(
  () => ({ processing: isProcessing.value, count: completedRecords.value.length }),
  ({ processing, count }) => {
    if (!processing && count > 0 && !hasRecordedHistory.value) {
      recordHistoryEntry()
      hasRecordedHistory.value = true
    }
  },
  { deep: true },
)

function showToast(message: string, variant: 'info' | 'success' | 'error' = 'info', durationMs = 2500) {
  if (!process.client) return
  toastState.message = message
  toastState.variant = variant
  toastState.visible = true
  if (toastState.timeoutId) {
    clearTimeout(toastState.timeoutId)
  }
  toastState.timeoutId = setTimeout(() => {
    toastState.visible = false
  }, durationMs)
}
</script>
