<template>
  <div class="container mx-auto max-w-5xl px-4 py-8">
    <div class="mb-8">
      <NuxtLink to="/" class="text-sm text-primary hover:underline">← Back to Digest</NuxtLink>
      <h1 class="mt-3 text-3xl font-semibold">Shared Digest</h1>
      <p class="text-muted-foreground">Created {{ formattedCreatedAt }}</p>
    </div>

    <div v-if="errorMessage" class="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else-if="isLoading" class="flex items-center gap-3">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
      <p class="text-muted-foreground">Loading digest…</p>
    </div>

    <template v-else>
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <Badge variant="secondary">{{ digest?.summary.total }} URLs</Badge>
        <Badge variant="outline">Processed in {{ formatDuration(digest?.summary.durationMs || 0) }}</Badge>
        <Badge v-if="digest?.summary.shortlistedTotal" variant="outline" class="border-amber-300 text-amber-900">
          {{ digest?.summary.shortlistedTotal }} Shortlisted
        </Badge>
        <template v-for="item in stageBadgeItems" :key="item.stage">
          <Badge :class="item.badgeClass" class="text-xs font-medium">
            {{ item.label }}: {{ item.count }}
          </Badge>
        </template>
      </div>

      <div
        v-if="stageCounts.all"
        class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            Cards ({{ filteredEntries.length }} of {{ stageCounts.all }})
          </h2>
          <p v-if="activeStageLabel" class="text-sm text-muted-foreground">
            Showing {{ activeStageLabel }} cards
          </p>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <label
            for="shared-stage-filter"
            class="font-medium uppercase tracking-wide text-muted-foreground"
          >
            Stage
          </label>
          <select
            id="shared-stage-filter"
            v-model="stageFilter"
            class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option
              v-for="option in stageFilterOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <ArticleCard
          v-for="entry in filteredEntries"
          :key="`${entry.record.url || 'record'}-${entry.index}`"
          :article="entry.record"
          :interactive="false"
        />
      </div>

      <p v-if="stageCounts.all === 0" class="text-muted-foreground">
        No records found in this digest.
      </p>
      <p v-else-if="filteredEntries.length === 0" class="text-muted-foreground">
        No cards in {{ activeStageLabel || 'the selected' }} stage.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge'
import {
  REVIEW_STAGE_BADGE_CLASSES,
  REVIEW_STAGE_LABELS,
  REVIEW_STAGE_ORDER,
  ensureReviewStage,
  type ReviewStageValue,
} from '~/lib/reviewStage'

const route = useRoute()
const digestId = computed(() => route.params.id as string)

const { data, pending, error } = await useFetch(() => `/api/digest/${digestId.value}`, {
  server: true,
  key: () => `digest-${digestId.value}`,
})

const digest = computed(() => data.value?.data)
const isLoading = computed(() => pending.value)
const errorMessage = computed(() => error.value?.statusMessage || error.value?.message)

type StageCounts = Record<'all', number> & Record<ReviewStageValue, number>

const stageFilter = ref<'all' | ReviewStageValue>('all')

const recordEntries = computed(() => {
  const records = digest.value?.records ?? []
  return records.map((record, index) => ({
    record: ensureReviewStage(record),
    index,
  }))
})

const stageCounts = computed<StageCounts>(() => {
  const counts: StageCounts = {
    all: recordEntries.value.length,
    analyst_review: 0,
    awaiting_manager: 0,
    needs_revision: 0,
    shortlisted: 0,
    saved_for_later: 0,
  }

  recordEntries.value.forEach(({ record }) => {
    counts[record.reviewStage] += 1
  })

  return counts
})

const stageFilterOptions = computed(() => [
  {
    value: 'all' as const,
    label: `All stages (${stageCounts.value.all})`,
  },
  ...REVIEW_STAGE_ORDER.map((stage) => ({
    value: stage,
    label: `${REVIEW_STAGE_LABELS[stage]} (${stageCounts.value[stage]})`,
  })),
])

const activeStageLabel = computed(() =>
  stageFilter.value === 'all' ? '' : REVIEW_STAGE_LABELS[stageFilter.value],
)

const stageBadgeItems = computed(() =>
  REVIEW_STAGE_ORDER.map((stage) => ({
    stage,
    label: REVIEW_STAGE_LABELS[stage],
    count: stageCounts.value[stage],
    badgeClass: REVIEW_STAGE_BADGE_CLASSES[stage],
  })).filter((item) => item.count > 0),
)

const filteredEntries = computed(() => {
  if (stageFilter.value === 'all') return recordEntries.value
  return recordEntries.value.filter(({ record }) => record.reviewStage === stageFilter.value)
})

watch(recordEntries, () => {
  if (stageFilter.value === 'all') return
  if (!stageCounts.value[stageFilter.value]) stageFilter.value = 'all'
})

watch(digest, () => {
  stageFilter.value = 'all'
})

const formattedCreatedAt = computed(() => {
  if (!digest.value?.createdAt) return 'just now'
  try {
    return new Date(digest.value.createdAt).toLocaleString()
  } catch {
    return digest.value.createdAt
  }
})

function formatDuration(ms: number): string {
  if (!ms) return '0s'
  const seconds = Math.round(ms / 100) / 10
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round((seconds % 60) * 10) / 10
  return `${minutes}m ${remaining.toFixed(1)}s`
}
</script>
