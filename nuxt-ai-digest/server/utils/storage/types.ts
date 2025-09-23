import type {
  ArticleRecord,
  ArticleEditMetadata,
  ArticleEditPayload,
  EditableArticleFields,
} from '~/types'

export type ArticleQueueStatus = 'queued' | 'processing' | 'ready' | 'error'

export type ArticleRescanStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'error'

export type ArticleReviewStage =
  | 'analyst_review'
  | 'awaiting_manager'
  | 'needs_revision'
  | 'shortlisted'
  | 'saved_for_later'

export interface ArticleHistoryEntry {
  version: number
  editedAt: string
  editedBy: string
  diffKeys: string[]
  payload: EditableArticleFields
  notes?: string
}

export interface ArticleRescanState {
  status: ArticleRescanStatus
  requestedAt?: string
  completedAt?: string
  error?: string
}

export interface PersistedArticleRecord extends ArticleRecord {
  id: string
  original?: EditableArticleFields
  edits?: ArticleEditPayload
  editMetadata?: ArticleEditMetadata
  shortlisted?: boolean
  status?: ArticleQueueStatus
  reviewStage?: ArticleReviewStage
  latest?: EditableArticleFields
  history?: ArticleHistoryEntry[]
  rescanState?: ArticleRescanState
  lastSyncedAt?: string
  lastReviewedAt?: string
}

export interface PersistedDigestSummary {
  total: number
  durationMs: number
  shortlistedTotal?: number
  editedTotal?: number
}

export interface PersistedDigest {
  id: string
  createdAt: string
  summary: PersistedDigestSummary
  records: PersistedArticleRecord[]
  metadata?: Record<string, any>
}

export interface DigestStoreDriver {
  init(): Promise<void>
  saveDigest(input: Omit<PersistedDigest, 'id'>): Promise<PersistedDigest>
  updateDigest(id: string, updater: (current: PersistedDigest) => PersistedDigest | Promise<PersistedDigest>): Promise<PersistedDigest>
  getDigest(id: string): Promise<PersistedDigest | null>
  listDigests(): Promise<PersistedDigest[]>
  clearDigests(): Promise<void>
}

export interface DigestStoreConfig {
  driver: DigestStoreDriver
}
