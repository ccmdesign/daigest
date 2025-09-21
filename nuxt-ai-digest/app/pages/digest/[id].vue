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
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <ArticleCard
          v-for="(record, index) in digest?.records || []"
          :key="index"
          :article="record"
        />
      </div>

      <p v-if="(digest?.records?.length || 0) === 0" class="text-muted-foreground">
        No records found in this digest.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge'

const route = useRoute()
const digestId = computed(() => route.params.id as string)

const { data, pending, error } = await useFetch(() => `/api/digest/${digestId.value}`, {
  server: true,
  key: () => `digest-${digestId.value}`,
})

const digest = computed(() => data.value?.data)
const isLoading = computed(() => pending.value)
const errorMessage = computed(() => error.value?.statusMessage || error.value?.message)

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
