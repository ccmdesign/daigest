import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type {
  DigestStoreDriver,
  PersistedDigest,
  PersistedArticleRecord,
  ArticleHistoryEntry,
  ArticleRescanState,
  ArticleQueueStatus,
  ArticleReviewStage,
} from './types'

function generateId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 12)
}

function getStorePath(): string {
  const relativePath = process.env.NUXT_DIGEST_STORE_PATH || 'data/digests.json'
  return join(process.cwd(), relativePath)
}

export class JsonDigestStoreDriver implements DigestStoreDriver {
  private cache = new Map<string, PersistedDigest>()
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      const raw = await readFile(getStorePath(), 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        parsed.forEach((item: PersistedDigest) => {
          const normalized = normalizeDigest(item)
          this.cache.set(normalized.id, normalized)
        })
      }
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.warn('Failed to load JSON digest store', error)
      }
    }

    this.initialized = true
  }

  async saveDigest(input: Omit<PersistedDigest, 'id'>): Promise<PersistedDigest> {
    await this.init()
    const digest = normalizeDigest({
      ...input,
      id: generateId(),
    })
    this.cache.set(digest.id, digest)
    await this.persist()
    return digest
  }

  async updateDigest(id: string, updater: (current: PersistedDigest) => PersistedDigest | Promise<PersistedDigest>): Promise<PersistedDigest> {
    await this.init()
    const current = this.cache.get(id)
    if (!current) {
      throw new Error(`Digest ${id} not found`)
    }
    const updatedCandidate = await updater(current)
    const updated = normalizeDigest(updatedCandidate)
    this.cache.set(id, updated)
    await this.persist()
    return updated
  }

  async getDigest(id: string): Promise<PersistedDigest | null> {
    await this.init()
    return this.cache.get(id) || null
  }

  async listDigests(): Promise<PersistedDigest[]> {
    await this.init()
    return Array.from(this.cache.values())
  }

  async clearDigests(): Promise<void> {
    await this.init()
    this.cache.clear()
    await this.persist()
  }

  private async persist(): Promise<void> {
    const payload = JSON.stringify(Array.from(this.cache.values()), null, 2)
    const storePath = getStorePath()
    const dir = dirname(storePath)
    await mkdir(dir, { recursive: true })
    await writeFile(storePath, payload, 'utf-8')
  }
}

function normalizeDigest(digest: PersistedDigest): PersistedDigest {
  return {
    ...digest,
    records: Array.isArray(digest.records) ? digest.records.map(normalizeRecord) : [],
  }
}

function normalizeRecord(record: PersistedArticleRecord | any): PersistedArticleRecord {
  const existingId = record?.id
  const id = typeof existingId === 'string' && existingId.trim().length > 0 ? existingId : generateId()
  const status = normalizeStatus(record?.status)
  const reviewStage = normalizeReviewStage(record?.reviewStage, {
    shortlisted: Boolean(record?.shortlisted),
  })
  const history = normalizeHistory(record?.history)
  const rescanState = normalizeRescanState(record?.rescanState)

  return {
    ...record,
    id,
    status,
    reviewStage,
    history,
    rescanState,
  }
}

function normalizeStatus(status: unknown): ArticleQueueStatus {
  if (status === 'queued' || status === 'processing' || status === 'ready' || status === 'error') {
    return status
  }
  return 'ready'
}

function normalizeHistory(history: unknown): ArticleHistoryEntry[] {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const version = typeof entry.version === 'number' ? entry.version : 0
      const editedAt = typeof entry.editedAt === 'string' ? entry.editedAt : ''
      const editedBy = typeof entry.editedBy === 'string' ? entry.editedBy : ''
      const diffKeys = Array.isArray(entry.diffKeys) ? entry.diffKeys.filter((key) => typeof key === 'string') : []
      const payload =
        typeof entry.payload === 'object' && entry.payload !== null
          ? (entry.payload as ArticleHistoryEntry['payload'])
          : ({} as ArticleHistoryEntry['payload'])
      const notes = typeof entry.notes === 'string' ? entry.notes : undefined

      if (!editedAt || !editedBy) {
        return null
      }

      return {
        version,
        editedAt,
        editedBy,
        diffKeys,
        payload,
        notes,
      }
    })
    .filter((entry): entry is ArticleHistoryEntry => entry !== null)
}

function normalizeReviewStage(
  reviewStage: unknown,
  options: { shortlisted?: boolean } = {},
): ArticleReviewStage {
  const validStages: ArticleReviewStage[] = [
    'analyst_review',
    'awaiting_manager',
    'needs_revision',
    'shortlisted',
    'saved_for_later',
  ]

  if (typeof reviewStage === 'string' && validStages.includes(reviewStage as ArticleReviewStage)) {
    return reviewStage as ArticleReviewStage
  }

  if (options.shortlisted) {
    return 'shortlisted'
  }

  return 'analyst_review'
}

function normalizeRescanState(state: unknown): ArticleRescanState {
  if (state && typeof state === 'object') {
    const typed = state as Partial<ArticleRescanState>
    const status = typed.status
    if (status === 'idle' || status === 'queued' || status === 'processing' || status === 'completed' || status === 'error') {
      return {
        status,
        requestedAt: typeof typed.requestedAt === 'string' ? typed.requestedAt : undefined,
        completedAt: typeof typed.completedAt === 'string' ? typed.completedAt : undefined,
        error: typeof typed.error === 'string' ? typed.error : undefined,
      }
    }
  }

  return { status: 'idle' }
}
