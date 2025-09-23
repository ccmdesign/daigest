import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import {
  clearDigests,
  getDigest,
  listDigests,
  resetDigestStoreCache,
  saveDigest,
  updateDigest,
} from '../server/utils/digestStore'
import { applyReviewStageUpdate } from '../server/utils/digestMutations'

const TMP_DIR = join(process.cwd(), 'tmp-tests')

let storePath = ''

beforeEach(async () => {
  storePath = join(TMP_DIR, `digests-${Date.now()}-${Math.random()}.json`)
  process.env.NUXT_DIGEST_STORE_PATH = storePath
  resetDigestStoreCache()
  await clearDigests()
})

afterEach(async () => {
  resetDigestStoreCache()
  try {
    await fs.rm(dirname(storePath), { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
})

describe('digestStore', () => {
  it('saves and retrieves digests', async () => {
    const created = await saveDigest({
      createdAt: new Date().toISOString(),
      summary: { total: 2, durationMs: 1200 },
      records: [createRecord('https://example.com')],
    })

    expect(created.id).toBeTruthy()

    const fetched = await getDigest(created.id)
    expect(fetched?.id).toBe(created.id)
    expect(fetched?.summary.total).toBe(2)
  })

  it('persists digests to disk between calls', async () => {
    const first = await saveDigest({
      createdAt: new Date().toISOString(),
      summary: { total: 1, durationMs: 500 },
      records: [createRecord('https://a.com')],
    })

    // Force reload by clearing in-memory cache only
    resetDigestStoreCache()
    const digests = await listDigests()
    expect(digests.find((d) => d.id === first.id)).toBeDefined()
  })

  it('stores metadata when provided', async () => {
    const created = await saveDigest({
      createdAt: new Date().toISOString(),
      summary: { total: 1, durationMs: 250, shortlistedTotal: 0 },
      records: [createRecord('https://meta.com')],
      metadata: {
        actor: 'Test Reviewer',
        createdVia: 'unit-test',
      },
    })

    expect(created.metadata?.actor).toBe('Test Reviewer')
    expect(created.metadata?.createdVia).toBe('unit-test')
  })

  it('persists shortlisted flag and aggregates', async () => {
    const created = await saveDigest({
      createdAt: new Date().toISOString(),
      summary: { total: 2, durationMs: 400, shortlistedTotal: 1 },
      records: [createRecord('https://shortlist.com', true), createRecord('https://other.com', false)],
    })

    expect(created.summary.shortlistedTotal).toBe(1)
    const shortlisted = created.records.filter((record) => record.shortlisted)
    expect(shortlisted).toHaveLength(1)
    expect(shortlisted[0]?.url).toBe('https://shortlist.com')
    expect(shortlisted[0]?.reviewStage).toBe('shortlisted')
  })

  it('normalizes reviewStage defaults for legacy records', async () => {
    const created = await saveDigest({
      createdAt: new Date().toISOString(),
      summary: { total: 1, durationMs: 150 },
      // Intentionally omit reviewStage to ensure defaulting works
      records: [
        {
          ...createRecord('https://legacy.com', false),
          reviewStage: undefined,
        },
      ],
    })

    expect(created.records[0]?.reviewStage).toBe('analyst_review')
  })

  it('updates review stage and shortlisted flags while recalculating summary totals', async () => {
    const created = await saveDigest({
      createdAt: new Date().toISOString(),
      summary: { total: 1, durationMs: 200 },
      records: [createRecord('https://stage-update.com', false, 'analyst_review')],
    })

    const recordId = created.records[0]?.id as string
    expect(recordId).toBeTruthy()

    const timestamp = new Date().toISOString()
    let updatedStageRecord: any = null

    await updateDigest(created.id, (current) => {
      const { digest, record } = applyReviewStageUpdate(current, {
        recordId,
        shortlisted: true,
        timestamp,
      })
      updatedStageRecord = record
      return digest
    })

    expect(updatedStageRecord?.reviewStage).toBe('shortlisted')
    expect(updatedStageRecord?.shortlisted).toBe(true)

    const afterShortlist = await getDigest(created.id)
    expect(afterShortlist?.summary.shortlistedTotal).toBe(1)

    await updateDigest(created.id, (current) => {
      const { digest } = applyReviewStageUpdate(current, {
        recordId,
        reviewStage: 'needs_revision',
        shortlisted: false,
        timestamp,
      })
      return digest
    })

    const finalDigest = await getDigest(created.id)
    const finalRecord = finalDigest?.records.find((record) => record.id === recordId)
    expect(finalRecord?.reviewStage).toBe('needs_revision')
    expect(finalRecord?.shortlisted).toBe(false)
    expect(finalDigest?.summary.shortlistedTotal).toBe(0)
  })
})

function createRecord(url: string, shortlisted = false, reviewStage?: string) {
  return {
    id: '',
    url,
    title: '',
    description: '',
    author: '',
    published_on: '',
    publication_date: '',
    body: '',
    word_count: 0,
    tags: [],
    publisher: '',
    language: '',
    confidence: 90,
    reason: 'Test fixture',
    provider: 'test-provider',
    provenance: {},
    providersUsed: [],
    notes: [],
    redacted: false,
    shortlisted,
    reviewStage,
  }
}
