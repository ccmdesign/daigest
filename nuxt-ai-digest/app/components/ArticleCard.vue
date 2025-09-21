<template>
  <Card :class="cardClasses">
    <CardHeader class="space-y-2">
      <div class="flex items-start justify-between gap-3">
        <CardTitle class="text-lg font-semibold leading-snug">
          {{ article.title || 'Untitled Article' }}
        </CardTitle>
        <Badge :class="confidenceBadgeClass">
          {{ article.confidence }}%
        </Badge>
      </div>

      <CardDescription v-if="metaLine" class="text-sm text-muted-foreground">
        {{ metaLine }}
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-4 text-sm">
      <p v-if="article.description" class="text-muted-foreground">
        {{ article.description }}
      </p>

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

        <p v-if="article.notes.length" class="text-xs text-muted-foreground">
          {{ article.notes.join(' • ') }}
        </p>
      </template>

      <p class="text-[11px] text-muted-foreground">
        Processed by {{ providerLabel }}
      </p>
    </CardContent>

    <CardFooter class="flex flex-wrap items-center justify-between gap-3">
      <Button
        size="sm"
        variant="ghost"
        class="gap-1"
        :disabled="!article.url"
        @click="openOriginal"
      >
        Read Original
      </Button>

      <div class="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" class="gap-1" @click="copyDetails">
          Copy Details
        </Button>
        <Button size="sm" variant="outline" class="gap-1" @click="copyAsMarkdown">
          Markdown
        </Button>
        <Button size="sm" variant="outline" class="gap-1" @click="copyAsJson">
          JSON
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
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

const MAX_TAGS = 5

const props = defineProps<{ article: ArticleRecord }>()

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
  const base = 'shrink-0 font-semibold'
  if (props.article.confidence >= 80) return cn(base, 'bg-green-100 text-green-800 border border-green-200')
  if (props.article.confidence >= 40) return cn(base, 'bg-yellow-100 text-yellow-800 border border-yellow-200')
  return cn(base, 'bg-red-100 text-red-800 border border-red-200')
})

const cardClasses = computed(() => {
  const base = 'transition-shadow duration-200'
  if (props.article.confidence >= 80) return cn(base, 'border-l-4 border-l-green-500')
  if (props.article.confidence >= 40) return cn(base, 'border-l-4 border-l-yellow-500')
  return cn(base, 'border-l-4 border-l-red-500')
})

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
