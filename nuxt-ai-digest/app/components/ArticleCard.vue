<template>
  <Card :class="cardClasses">
    <CardHeader class="space-y-2">
      <div class="flex items-start justify-between gap-3">
        <div class="flex flex-col gap-1">
          <CardTitle class="text-lg font-semibold leading-snug">
            <span
              ref="titleRef"
              :contenteditable="isEditing"
              :class="titleClasses"
              spellcheck="false"
              @input="handleTitleInput"
            >
              {{ editableTitle }}
            </span>
          </CardTitle>
          <CardDescription v-if="metaLine" class="text-sm text-muted-foreground">
            {{ metaLine }}
          </CardDescription>
        </div>
        <div class="flex items-center gap-2">
          <Badge
            :class="stageBadgeClass"
            class="text-[11px] font-medium uppercase tracking-wide"
          >
            {{ stageBadgeLabel }}
          </Badge>
          <Badge :class="confidenceBadgeClass">
            {{ confidenceBadgeLabel }}
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-4 text-sm">
      <div
        v-if="isEditing || editableDescription"
        class="text-muted-foreground"
      >
        <p class="whitespace-pre-line">
          <span
            ref="descriptionRef"
            :contenteditable="isEditing"
            :class="descriptionClasses"
            spellcheck="false"
            @input="handleDescriptionInput"
          >
            {{ editableDescription }}
          </span>
        </p>
      </div>

      <div
        v-if="article.redacted"
        class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive"
      >
        <p class="font-medium">Low confidence content</p>
        <p class="mt-1 text-sm">
          {{ article.reason }}
        </p>
      </div>

      <template v-else>
        <div v-if="detailMeta.length" class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span v-for="item in detailMeta" :key="item">
            {{ item }}
          </span>
        </div>

        <div v-if="article.tags.length" class="flex flex-wrap gap-1">
          <Badge
            v-for="tag in displayTags"
            :key="tag"
            variant="secondary"
            class="text-xs capitalize"
          >
            {{ tag }}
          </Badge>
          <Badge
            v-if="article.tags.length > MAX_TAGS"
            variant="outline"
            class="text-xs"
          >
            +{{ article.tags.length - MAX_TAGS }}
          </Badge>
        </div>

      </template>

      <div class="border-t border-muted/40 pt-3">
        <Button
          size="sm"
          variant="ghost"
          class="h-auto p-0 text-xs font-medium text-muted-foreground hover:text-foreground"
          @click="toggleTechnical"
        >
          {{ showTechnical ? 'Hide technical details' : 'Show technical details' }}
        </Button>

        <div v-if="showTechnical" class="mt-3 space-y-2 text-xs text-muted-foreground">
          <p>Processed by {{ providerLabel }}</p>
          <p v-if="providersList">Providers used: {{ providersList }}</p>
          <p v-if="article.reason">Confidence notes: {{ article.reason }}</p>
          <div v-if="provenanceEntries.length" class="space-y-1">
            <p class="font-medium text-foreground">Provenance</p>
            <ul class="list-disc space-y-1 pl-4">
              <li v-for="([field, source]) in provenanceEntries" :key="field">
                <span class="font-medium">{{ field }}:</span> {{ source }}
              </li>
            </ul>
          </div>
          <p v-if="article.notes.length">Pipeline notes: {{ article.notes.join(' • ') }}</p>
        </div>
      </div>
    </CardContent>

    <CardFooter class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          class="gap-1"
          :disabled="!article.url"
          @click="openOriginal"
        >
          Read Original
        </Button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <template v-if="props.interactive">
          <template v-if="isEditing">
            <Button size="sm" variant="default" class="gap-1" @click="saveEditing">
              Save
            </Button>
            <Button size="sm" variant="ghost" class="gap-1" @click="cancelEditing">
              Cancel
            </Button>
          </template>
          <template v-else>
            <div class="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" class="gap-1" @click="startEditing">
                Edit
              </Button>
              <Button
                v-if="props.newsletterLabel"
                size="sm"
                variant="outline"
                class="gap-1"
                @click="handleToggleNewsletter"
              >
                {{ props.newsletterLabel }}
              </Button>
              <Button
                v-if="props.canSubmit"
                size="sm"
                variant="default"
                class="gap-1"
                @click="handleSubmitManager"
              >
                Submit to Manager
              </Button>
            </div>
          </template>
        </template>
        <div class="relative" ref="moreMenuRef">
          <Button
            ref="moreButtonRef"
            size="sm"
            variant="ghost"
            class="h-8 w-8 p-0"
            @click="toggleMoreMenu"
          >
            <span class="sr-only">More options</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-1.5 6.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" />
            </svg>
          </Button>
          <div
            v-if="moreMenuOpen"
            class="absolute right-0 z-20 mt-2 w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button class="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100" @click="onMoreAction('details')">
              Copy Details
            </button>
            <button class="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100" @click="onMoreAction('markdown')">
              Copy Markdown
            </button>
            <button class="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100" @click="onMoreAction('json')">
              Copy JSON
            </button>
          </div>
        </div>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { cn } from '~/lib/utils'
import type { ArticleRecord } from '~/types'
import {
  REVIEW_STAGE_BADGE_CLASSES,
  REVIEW_STAGE_LABELS,
  normalizeReviewStage,
  type ReviewStageValue,
} from '~/lib/reviewStage'

const MAX_TAGS = 5

const props = withDefaults(
  defineProps<{
    article: ArticleRecord
    interactive?: boolean
    canSubmit?: boolean
    newsletterLabel?: string
  }>(),
  {
    interactive: true,
    canSubmit: false,
    newsletterLabel: undefined,
  },
)
const emit = defineEmits<{
  (e: 'edit-save', value: { title: string; description: string }): void
  (e: 'toggle-newsletter'): void
  (e: 'submit-manager'): void
}>()

const showTechnical = ref(false)
const isEditing = ref(false)
const editedTitle = ref('')
const editedDescription = ref('')
const titleRef = ref<HTMLElement | null>(null)
const descriptionRef = ref<HTMLElement | null>(null)
const moreMenuOpen = ref(false)
const moreMenuRef = ref<HTMLElement | null>(null)
const moreButtonRef = ref<HTMLElement | null>(null)

const reviewStage = computed<ReviewStageValue>(() =>
  normalizeReviewStage(props.article.reviewStage, { shortlisted: props.article.shortlisted }),
)

const stageBadgeLabel = computed(() => REVIEW_STAGE_LABELS[reviewStage.value])

const stageBadgeClass = computed(() => REVIEW_STAGE_BADGE_CLASSES[reviewStage.value])

const titleClasses = computed(() =>
  cn('outline-none focus:outline-none block break-words', isEditing.value ? 'rounded border border-slate-300 bg-white px-1 py-0.5 text-slate-900 shadow-sm' : ''),
)

const descriptionClasses = computed(() =>
  cn('outline-none focus:outline-none block break-words', isEditing.value ? 'rounded border border-slate-200 bg-white px-1 py-0.5 text-slate-900 shadow-sm' : ''),
)

const editableTitle = computed(() => (isEditing.value ? editedTitle.value : props.article.title || 'Untitled Article'))
const editableDescription = computed(() => (isEditing.value ? editedDescription.value : props.article.description || ''))

const confidenceBadgeLabel = computed(() =>
  props.article.reviewedBy ? `Reviewed by ${props.article.reviewedBy}` : `${props.article.confidence}%`,
)

const metaLine = computed(() => {
  const parts: string[] = []
  if (props.article.author) parts.push(props.article.author)
  if (props.article.publisher) parts.push(props.article.publisher)
  if (props.article.published_on) parts.push(formatDate(props.article.published_on))
  return parts.join(' • ')
})

const detailMeta = computed(() => {
  const items: string[] = []
  if (props.article.word_count) items.push(formatWordCount(props.article.word_count))
  if (props.article.language) items.push(props.article.language.toUpperCase())
  return items
})

const displayTags = computed(() => props.article.tags.slice(0, MAX_TAGS))

const providerLabel = computed(() => {
  if (props.article.providersUsed?.length) {
    return `${props.article.provider} (${props.article.providersUsed.join(', ')})`
  }
  return props.article.provider
})

const confidenceBadgeClass = computed(() => {
  const base = 'shrink-0 font-semibold border'
  if (props.article.reviewedBy) {
    return cn(base, 'border-sky-300 bg-sky-100 text-sky-800')
  }
  if (props.article.confidence >= 80) return cn(base, 'border-green-200 bg-green-100 text-green-800')
  if (props.article.confidence >= 40) return cn(base, 'border-yellow-200 bg-yellow-100 text-yellow-800')
  return cn(base, 'border-red-200 bg-red-100 text-red-800')
})

const cardClasses = computed(() => {
  const base = 'transition-shadow duration-200'
  if (props.article.confidence >= 80) return cn(base, 'border-l-4 border-l-green-500')
  if (props.article.confidence >= 40) return cn(base, 'border-l-4 border-l-yellow-500')
  return cn(base, 'border-l-4 border-l-red-500')
})

const provenanceEntries = computed(() => Object.entries(props.article.provenance || {}))

const providersList = computed(() => props.article.providersUsed?.join(', ') || '')

const shortlistButtonClass = computed(() =>
  cn('gap-1', props.article.shortlisted ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100' : ''),
)

watch(
  () => props.article,
  (next) => {
    if (isEditing.value) return
    editedTitle.value = next.title || 'Untitled Article'
    editedDescription.value = next.description || ''
  },
  { immediate: true },
)

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  if (!moreMenuOpen.value) return
  if (moreMenuRef.value?.contains(target)) return
  if (moreButtonRef.value?.contains(target)) return
  moreMenuOpen.value = false
}

onMounted(() => {
  if (process.client) {
    document.addEventListener('mousedown', handleDocumentClick)
  }
})

onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener('mousedown', handleDocumentClick)
  }
})

function toggleTechnical() {
  showTechnical.value = !showTechnical.value
}

function startEditing() {
  if (!props.interactive) return
  isEditing.value = true
  editedTitle.value = props.article.title || 'Untitled Article'
  editedDescription.value = props.article.description || ''
  nextTick(() => {
    titleRef.value?.focus()
  })
}

function cancelEditing() {
  isEditing.value = false
  editedTitle.value = props.article.title || 'Untitled Article'
  editedDescription.value = props.article.description || ''
  moreMenuOpen.value = false
}

function saveEditing() {
  const title = (titleRef.value?.innerText ?? editedTitle.value).trim()
  const description = (descriptionRef.value?.innerText ?? editedDescription.value).trim()
  emit('edit-save', { title, description })
  isEditing.value = false
  moreMenuOpen.value = false
}

function handleTitleInput(event: Event) {
  const target = event.target as HTMLElement | null
  editedTitle.value = target?.innerText ?? ''
}

function handleDescriptionInput(event: Event) {
  const target = event.target as HTMLElement | null
  editedDescription.value = target?.innerText ?? ''
}

function toggleMoreMenu() {
  moreMenuOpen.value = !moreMenuOpen.value
}

function onMoreAction(action: 'details' | 'markdown' | 'json') {
  switch (action) {
    case 'details':
      copyDetails()
      break
    case 'markdown':
      copyAsMarkdown()
      break
    case 'json':
      copyAsJson()
      break
  }
  moreMenuOpen.value = false
}

function handleToggleNewsletter() {
  if (!props.interactive || isEditing.value) return
  emit('toggle-newsletter')
}

function handleSubmitManager() {
  if (!props.interactive || isEditing.value) return
  emit('submit-manager')
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    console.warn('Failed to format date', error)
    return dateString
  }
}

function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`
  if (count > 0) return `${count} words`
  return ''
}

function openOriginal() {
  if (process.client && props.article.url) {
    window.open(props.article.url, '_blank', 'noopener')
  }
}

async function copyToClipboard(payload: string) {
  if (!process.client || !navigator?.clipboard) {
    console.warn('Clipboard API unavailable')
    return
  }
  try {
    await navigator.clipboard.writeText(payload)
  } catch (error) {
    console.error('Failed to copy to clipboard', error)
  }
}

function copyDetails() {
  const lines = [props.article.title, props.article.url]
  if (props.article.description) lines.push('', props.article.description)
  copyToClipboard(lines.filter(Boolean).join('\n'))
}

function copyAsMarkdown() {
  const markdown = `# ${props.article.title || 'Untitled Article'}\n\n` +
    `**URL:** ${props.article.url}\n` +
    `**Author:** ${props.article.author || 'Unknown'}\n` +
    `**Publisher:** ${props.article.publisher || 'Unknown'}\n` +
    `**Published:** ${props.article.published_on || 'Unknown'}\n` +
    `**Confidence:** ${props.article.confidence}%\n\n` +
    `${props.article.description || ''}`
  copyToClipboard(markdown.trim())
}

function copyAsJson() {
  copyToClipboard(JSON.stringify(props.article, null, 2))
}
</script>
