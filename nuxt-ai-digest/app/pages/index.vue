<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div
      v-if="toastState.visible"
      :class="['fixed right-4 top-4 z-50 rounded-md border px-4 py-2 shadow-md text-sm transition-opacity', toastVariantClass]"
    >
      {{ toastState.message }}
    </div>

    <!-- Header -->
    <header class="mb-8 flex flex-col items-center gap-3 md:flex-row md:justify-between">
      <div>
        <h1 class="text-4xl font-bold text-gray-900">
          AI Link Digest
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl">
          Paste article links below and get enriched metadata, summaries, and confidence scoring for each link.
        </p>
      </div>
      <nav class="flex items-center gap-2 rounded-full border border-muted bg-white px-3 py-1 shadow-sm">
        <NuxtLink
          to="/"
          :class="navLinkClass('/')"
        >
          Analyst Workspace
        </NuxtLink>
        <NuxtLink
          to="/review"
          :class="navLinkClass('/review')"
        >
          Manager Review
        </NuxtLink>
      </nav>
    </header>

    <div class="mx-auto mb-8 max-w-md">
      <label for="reviewer-name" class="mb-1 block text-sm font-medium text-gray-700">Reviewer name</label>
      <Input
        id="reviewer-name"
        v-model="reviewerName"
        type="text"
        placeholder="Add your name for saved digests"
        class="w-full"
      />
      <p class="mt-1 text-xs text-muted-foreground">Used to tag history entries and saved digests.</p>
    </div>

    <!-- URL Input Section -->
    <form
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
      @submit.prevent="processUrls"
    >
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
            as="input"
            type="submit"
            size="lg"
            class="px-6 py-3"
            :disabled="isSubmitDisabled"
            :value="submitLabel"
          />

          <Button
            v-if="completedRecords.length > 0"
            type="button"
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
    </form>

    <!-- Progress Panel -->
    <div v-if="hasProgress" class="mb-6">
      <Button variant="ghost" size="sm" class="flex items-center gap-2" @click="progressExpanded = !progressExpanded">
        <span class="font-medium">Progress ({{ progressSummary }})</span>
        <span class="text-xs text-muted-foreground">
          {{ progressExpanded ? 'Hide' : 'Show' }}
        </span>
      </Button>
      <div v-if="progressExpanded" class="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div
              v-if="isProcessing"
              class="h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"
            ></div>
            <div v-else class="flex h-5 w-5 items-center justify-center text-blue-700">
              ✓
            </div>
            <div>
              <p class="text-blue-800 font-medium">
                {{ isProcessing ? 'Processing articles...' : 'Processing complete' }}
              </p>
              <p class="text-blue-600 text-sm">
                {{ processedCount }} /
                {{ statusItems.length || detectedUrls.length || completedRecords.length }} completed
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

    <!-- Staging List -->
    <section v-if="stagingEntries.length" class="space-y-4 mb-10">
      <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Staging (Analyst review)</h2>
          <p class="text-sm text-muted-foreground">Cards you can still edit or send to your manager.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" class="bg-green-100 text-green-800 border-green-200">{{ highConfidenceCount }} High</Badge>
          <Badge variant="secondary" class="bg-yellow-100 text-yellow-800 border-yellow-200">{{ mediumConfidenceCount }} Medium</Badge>
          <Badge variant="secondary" class="bg-red-100 text-red-800 border-red-200">{{ lowConfidenceCount }} Low</Badge>
          <Badge variant="outline" class="text-xs">{{ shortlistedCount }} Shortlisted</Badge>
        </div>
      </header>

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

      <div class="flex flex-col gap-6">
        <div
          v-for="entry in stagingEntries"
          :key="entryKey(entry)"
          class="space-y-2"
        >
          <ArticleCard
            :article="entry.record"
            :newsletter-label="entry.record.shortlisted ? 'Remove from Newsletter' : 'Add to Newsletter'"
            :can-submit="entry.record.reviewStage === 'analyst_review'"
            @toggle-newsletter="toggleShortlist(entry.index)"
            @submit-manager="submitToManager(entry.index)"
            @edit-save="handleEditSave(entry.index, $event)"
          />
        </div>
      </div>
    </section>

    <!-- Submitted List -->
    <section v-if="submittedEntries.length" class="space-y-4">
      <header class="flex flex-col gap-1">
        <button class="text-left" @click="submittedExpanded = !submittedExpanded">
          <h2 class="text-xl font-semibold text-gray-900">
            Submitted to Manager ({{ submittedEntries.length }})
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ submittedExpanded ? 'Hide cards already submitted' : 'Show cards already submitted' }}
          </p>
        </button>
      </header>

      <div v-if="submittedExpanded" class="flex flex-col gap-6">
        <div
          v-for="entry in submittedEntries"
          :key="entryKey(entry)"
          class="space-y-2"
        >
          <ArticleCard :article="entry.record" :interactive="false" />
        </div>
      </div>
    </section>

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
            <p v-if="entry.reviewer" class="text-xs text-muted-foreground">Reviewer: {{ entry.reviewer }}</p>
            <p v-if="typeof entry.shortlistedTotal === 'number'" class="text-xs text-muted-foreground">
              Shortlisted: {{ entry.shortlistedTotal }}
            </p>
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
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useLocalStorage, StorageSerializers } from '@vueuse/core'
import type { ArticleRecord } from '~/types'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Textarea } from '~/components/ui/textarea'
import { Input } from '~/components/ui/input'
import { useDigestProcessor } from '~/composables/useDigestProcessor'
import { useDigestApi } from '~/composables/useDigestApi'
import {
  REVIEW_STAGE_LABELS,
  ensureReviewStage,
  type ReviewStageValue,
} from '~/lib/reviewStage'

// Page metadata
useSeoMeta({
  title: 'AI Link Digest - Process Article Links',
  description: 'Process article links and get enriched metadata with confidence scoring'
})

// Reactive state
const urlInput = ref('')
const requestFetch = useRequestFetch()

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

const { updateRecordReviewStage } = useDigestApi()

type HistoryEntry = {
  runId: string
  createdAt: string
  total: number
  shareId?: string
  shareLink?: string
  reviewer?: string
  shortlistedTotal?: number
}

const digestHistory = useState<HistoryEntry[]>(
  'digest-history',
  () => [],
)

const historyEntries = computed(() => digestHistory.value)
const currentRunId = ref('')
const hasRecordedHistory = ref(false)
const reviewerName = useState('digest-reviewer-name', () => 'Analyst')
const reviewerLabel = computed(() => {
  const value = typeof reviewerName.value === 'string' ? reviewerName.value.trim() : ''
  return value || 'Analyst'
})

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

const progressExpanded = ref(false)

interface PersistedAnalystSession {
  records: ArticleRecord[]
  summary: {
    total: number
    durationMs: number
    shortlistedTotal?: number
  }
  digestId?: string
  link?: string
}

const persistedDigest = useLocalStorage<PersistedAnalystSession | null>(
  'analyst-current-digest',
  null,
  {
    serializer: StorageSerializers.object,
  },
)

const route = useRoute()

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
function navLinkClass(path: string): string {
  const base = 'rounded-full px-3 py-1 text-sm font-medium transition'
  const isActive = route.path === path || route.path.startsWith(path + '/')
  return `${base} ${isActive ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-primary/10'}`
}

const detectedUrls = computed(() => {
  if (!urlInput.value.trim()) return []

  const urlRegex = /https?:\/\/[^\s,\n]+/g
  const matches = urlInput.value.match(urlRegex) || []
  return [...new Set(matches)] // Remove duplicates
})

const submitLabel = computed(() => {
  if (isProcessing.value) return 'Processing...'

  const count = detectedUrls.value.length
  if (count === 0) return 'Process URLs'
  return `Process ${count} URL${count === 1 ? '' : 's'}`
})

const isSubmitDisabled = computed(() =>
  detectedUrls.value.length === 0 || isProcessing.value,
)

const hasProgress = computed(() => statusItems.value.length > 0 || isProcessing.value)

const progressSummary = computed(() => {
  const total = statusItems.value.length || summary.value.total || detectedUrls.value.length
  if (!total) return '0/0'
  const done = Math.min(processedCount.value, total)
  return `${done}/${total}`
})

type NormalizedArticleRecord = ArticleRecord & {
  reviewStage: ReviewStageValue
  shortlisted: boolean
}

type RecordEntry = {
  record: NormalizedArticleRecord
  index: number
}

const recordEntries = computed<RecordEntry[]>(() =>
  results.value.reduce<RecordEntry[]>((acc, record, index) => {
    if (!record) return acc
    const normalized = ensureReviewStage(record) as NormalizedArticleRecord
    acc.push({ record: normalized, index })
    return acc
  }, []),
)

const stagingEntries = computed(() =>
  recordEntries.value.filter(({ record }) => record.reviewStage !== 'awaiting_manager'),
)

const submittedEntries = computed(() =>
  recordEntries.value.filter(({ record }) => record.reviewStage === 'awaiting_manager'),
)

const completedRecords = computed(() => recordEntries.value.map((entry) => entry.record))

const submittedExpanded = ref(false)

const highConfidenceCount = computed(() => 
  completedRecords.value.filter(r => r.confidence >= 80).length
)

const mediumConfidenceCount = computed(() => 
  completedRecords.value.filter(r => r.confidence >= 40 && r.confidence < 80).length
)

const lowConfidenceCount = computed(() => 
  completedRecords.value.filter(r => r.confidence < 40).length
)

const shortlistedCount = computed(() => completedRecords.value.filter((record) => record.shortlisted).length)

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
    expectedLanguage: 'en',
  })
}

function clearResults() {
  reset()
  urlInput.value = ''
  resetShareState()
  if (process.client) persistedDigest.value = null
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
    reviewer: reviewerLabel.value,
    shortlistedTotal: shortlistedCount.value,
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

function refreshSummaryAggregates() {
  summary.value = {
    ...summary.value,
    total: completedRecords.value.length,
    shortlistedTotal: shortlistedCount.value,
  }
}

function entryKey(entry: RecordEntry): string {
  return String(entry.record.id || entry.record.url || entry.index)
}

function persistAnalystState() {
  if (!process.client) return
  if (!results.value.length) {
    persistedDigest.value = null
    return
  }
  const recordsPlain = results.value.map((record) => JSON.parse(JSON.stringify(record)))
  const summaryPlain = {
    total: summary.value.total || recordsPlain.length,
    durationMs: summary.value.durationMs || 0,
    shortlistedTotal:
      summary.value.shortlistedTotal !== undefined
        ? summary.value.shortlistedTotal
        : recordsPlain.filter((record) => record.shortlisted).length,
  }
  persistedDigest.value = {
    records: recordsPlain,
    summary: summaryPlain,
    digestId: shareState.digestId || undefined,
    link: shareState.link || undefined,
  }
}

onMounted(() => {
  if (!process.client) return
  const stored = persistedDigest.value
  if (!stored?.records?.length) return

  shareState.digestId = stored.digestId || ''
  shareState.link = stored.link || ''
  results.value = stored.records.map((record) => ensureReviewStage(record) as NormalizedArticleRecord)
  results.value = [...results.value]
  summary.value = {
    total: stored.summary?.total ?? stored.records.length,
    durationMs: stored.summary?.durationMs ?? 0,
    shortlistedTotal:
      stored.summary?.shortlistedTotal ??
      stored.records.filter((record: ArticleRecord) => record.shortlisted).length,
  }
})

watch(
  [results, summary, () => shareState.digestId, () => shareState.link],
  () => {
    persistAnalystState()
  },
  { deep: true },
)

async function setReviewStage(index: number, stage: ReviewStageValue) {
  const record = results.value[index]
  if (!record) return

  const previous = ensureReviewStage(record) as NormalizedArticleRecord
  if (previous.reviewStage === stage && previous.shortlisted === (stage === 'shortlisted')) {
    return
  }
  const optimistic = ensureReviewStage({
    ...record,
    reviewStage: stage,
    shortlisted: stage === 'shortlisted',
  })

  results.value[index] = optimistic
  results.value = [...results.value]
  refreshSummaryAggregates()

  const digestId = shareState.digestId
  const recordId = optimistic.id

  if (!digestId || !recordId) {
    showToast('Create a share link to persist stage changes', 'info')
    return
  }

  try {
    const response = await updateRecordReviewStage(digestId, recordId, {
      reviewStage: stage,
      shortlisted: optimistic.shortlisted,
    })

    const serverRecord = ensureReviewStage(response?.data?.record as ArticleRecord)
    results.value[index] = { ...optimistic, ...serverRecord }
    results.value = [...results.value]
    refreshSummaryAggregates()
  } catch (error: any) {
    results.value[index] = previous
    results.value = [...results.value]
    refreshSummaryAggregates()
    const message = error?.data?.message || error?.message || 'Failed to update stage'
    showToast(message, 'error')
  }
}

async function toggleShortlist(index: number) {
  const record = results.value[index]
  if (!record) return
  const isCurrentlyShortlisted = Boolean(record.shortlisted)
  const nextStage: ReviewStageValue = isCurrentlyShortlisted ? 'analyst_review' : 'shortlisted'
  await setReviewStage(index, nextStage)
}

async function submitToManager(index: number) {
  await setReviewStage(index, 'awaiting_manager')
}

function handleEditSave(index: number, payload: { title: string; description: string }) {
  const record = results.value[index]
  if (!record) return

  const updated = ensureReviewStage({
    ...record,
    title: payload.title || record.title,
    description: payload.description || record.description,
    reviewedBy: reviewerLabel.value,
  }) as NormalizedArticleRecord

  results.value[index] = updated
  results.value = [...results.value]
  refreshSummaryAggregates()
  persistAnalystState()
}

function downloadJson() {
  if (!completedRecords.value.length || !process.client) return
  const payload = {
    summary: {
      ...summary.value,
      total: completedRecords.value.length,
      shortlistedTotal: shortlistedCount.value,
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
    if (record.shortlisted) lines.push('- Status: Shortlisted')
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
    const response = await requestFetch('/api/digest', {
      method: 'POST',
      body: {
        records: completedRecords.value,
        summary: {
          total: completedRecords.value.length,
          durationMs: summary.value.durationMs || 0,
          shortlistedTotal: shortlistedCount.value,
        },
        metadata: {
          actor: reviewerLabel.value,
          createdVia: 'ui-share-link',
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
      if (Array.isArray(digest.records)) {
        results.value = digest.records.map((record: ArticleRecord) => ensureReviewStage(record) as NormalizedArticleRecord)
        results.value = [...results.value]
      }
      if (digest.summary) {
        summary.value = {
          total: Number(digest.summary.total) || completedRecords.value.length,
          durationMs: Number(digest.summary.durationMs) || summary.value.durationMs,
          shortlistedTotal: Number(digest.summary.shortlistedTotal) || shortlistedCount.value,
        }
      } else {
        refreshSummaryAggregates()
      }
      updateHistoryWithShare(digest.id, shareState.link)
      persistAnalystState()
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

watch(shortlistedCount, (count) => {
  if (isProcessing.value) return
  if (!completedRecords.value.length) return
  digestHistory.value = digestHistory.value.map((entry) =>
    entry.runId === currentRunId.value ? { ...entry, shortlistedTotal: count } : entry,
  )
})

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
