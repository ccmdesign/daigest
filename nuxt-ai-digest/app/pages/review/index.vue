<template>
  <div class="container mx-auto max-w-6xl px-4 py-8">
    <header class="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-semibold">Manager Review</h1>
        <p class="text-sm text-muted-foreground">Review analyst submissions and prepare the next newsletter.</p>
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

    <div v-if="!stagingRecords.length && !newsletterRecords.length" class="rounded-md border border-muted bg-muted/20 p-4 text-sm text-muted-foreground">
      No cards available yet. Analysts can submit cards from their workspace when ready.
    </div>

    <div v-else class="space-y-6">
      <div class="flex flex-wrap gap-2">
        <Button
          :variant="activeTab === 'staging' ? 'default' : 'outline'"
          size="sm"
          @click="activeTab = 'staging'"
        >
          Staging ({{ stagingRecords.length }})
        </Button>
        <Button
          :variant="activeTab === 'newsletter' ? 'default' : 'outline'"
          size="sm"
          @click="activeTab = 'newsletter'"
        >
          Newsletter ({{ newsletterRecords.length }})
        </Button>
      </div>

      <section v-if="activeTab === 'staging'" class="space-y-4">
        <p v-if="stagingRecords.length === 0" class="text-sm text-muted-foreground">
          No cards waiting for manager review.
        </p>
        <div
          v-for="record in stagingRecords"
          :key="recordKey(record)"
          class="space-y-2"
        >
          <ArticleCard
            :article="record"
            :newsletter-label="'Add to Newsletter'"
            @edit-save="(payload) => handleEditSave(record, payload)"
            @toggle-newsletter="() => handleStageChange(record, 'shortlisted')"
          />
        </div>
      </section>

      <section v-else class="space-y-4">
        <p v-if="newsletterRecords.length === 0" class="text-sm text-muted-foreground">
          No cards shortlisted for the next newsletter yet.
        </p>
        <div
          v-for="record in newsletterRecords"
          :key="recordKey(record)"
          class="space-y-2"
        >
          <ArticleCard
            :article="record"
            :newsletter-label="'Remove from Newsletter'"
            @edit-save="(payload) => handleEditSave(record, payload, 'Manager')"
            @toggle-newsletter="() => handleStageChange(record, 'awaiting_manager')"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useLocalStorage, StorageSerializers } from '@vueuse/core'
import ArticleCard from '~/components/ArticleCard.vue'
import { Button } from '~/components/ui/button'
import type { ArticleRecord } from '~/types'
import { ensureReviewStage, type ReviewStageValue } from '~/lib/reviewStage'
import { useDigestApi } from '~/composables/useDigestApi'

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

type ManagerRecord = ArticleRecord & {
  reviewStage: ReviewStageValue
  shortlisted: boolean
}

const persistedDigest = useLocalStorage<PersistedAnalystSession | null>(
  'analyst-current-digest',
  null,
  {
    serializer: StorageSerializers.object,
  },
)

const records = ref<ManagerRecord[]>([])
const summary = ref({ total: 0, durationMs: 0, shortlistedTotal: 0 })
const activeTab = ref<'staging' | 'newsletter'>('staging')

const { updateRecordReviewStage } = useDigestApi()
const route = useRoute()

function navLinkClass(path: string): string {
  const base = 'rounded-full px-3 py-1 text-sm font-medium transition'
  const isActive = route.path === path || route.path.startsWith(path + '/')
  return `${base} ${isActive ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-primary/10'}`
}

onMounted(() => {
  if (!process.client) return
  const stored = persistedDigest.value
  if (!stored?.records?.length) return

  records.value = stored.records.map((record) => ensureReviewStage(record) as ManagerRecord)
  summary.value = {
    total: stored.summary?.total ?? stored.records.length,
    durationMs: stored.summary?.durationMs ?? 0,
    shortlistedTotal:
      stored.summary?.shortlistedTotal ??
      records.value.filter((record) => record.reviewStage === 'shortlisted').length,
  }
})

watch(
  records,
  () => {
    refreshSummary()
    persistManagerState()
  },
  { deep: true },
)

const stagingRecords = computed(() => records.value.filter((record) => record.reviewStage === 'awaiting_manager'))
const newsletterRecords = computed(() => records.value.filter((record) => record.reviewStage === 'shortlisted'))

const digestId = computed(() => persistedDigest.value?.digestId || '')

function recordKey(record: ManagerRecord) {
  return record.id || record.url
}

function refreshSummary() {
  summary.value = {
    ...summary.value,
    total: records.value.length,
    shortlistedTotal: records.value.filter((record) => record.shortlisted).length,
  }
}

function persistManagerState() {
  if (!process.client) return
  if (!records.value.length) {
    persistedDigest.value = null
    return
  }
  const currentDigestId = digestId.value
  const existingLink = persistedDigest.value?.link
  persistedDigest.value = {
    records: records.value.map((record) => JSON.parse(JSON.stringify(record))),
    summary: { ...summary.value },
    digestId: currentDigestId || undefined,
    link: existingLink,
  }
}

function handleEditSave(record: ManagerRecord, payload: { title: string; description: string }, reviewer = 'Manager') {
  const key = recordKey(record)
  const index = records.value.findIndex((item) => recordKey(item) === key)
  if (index === -1) return

  const updated = ensureReviewStage({
    ...records.value[index],
    title: payload.title || records.value[index].title,
    description: payload.description || records.value[index].description,
    reviewedBy: reviewer,
  }) as ManagerRecord

  records.value.splice(index, 1, updated)
}

async function handleStageChange(record: ManagerRecord, stage: ReviewStageValue) {
  const key = recordKey(record)
  const index = records.value.findIndex((item) => recordKey(item) === key)
  if (index === -1) return

  const previous = records.value[index]
  if (previous.reviewStage === stage && previous.shortlisted === (stage === 'shortlisted')) {
    return
  }

  const optimistic = ensureReviewStage({
    ...previous,
    reviewStage: stage,
    shortlisted: stage === 'shortlisted',
  }) as ManagerRecord

  records.value.splice(index, 1, optimistic)

  if (!digestId.value || !optimistic.id) {
    return
  }

  try {
    await updateRecordReviewStage(digestId.value, optimistic.id, {
      reviewStage: stage,
      shortlisted: optimistic.shortlisted,
    })
  } catch (error) {
    records.value.splice(index, 1, previous)
  }
}

function moveToNewsletter(record: ManagerRecord) {
  handleStageChange(record, 'shortlisted')
}

function moveToStaging(record: ManagerRecord) {
  handleStageChange(record, 'awaiting_manager')
}
</script>
