import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import {
  clearDigests,
  getDigest,
  listDigests,
  resetDigestStoreCache,
  saveDigest,
} from '../server/utils/digestStore'

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
      records: [{ url: 'https://example.com', confidence: 90 }],
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
      records: [{ url: 'https://a.com', confidence: 80 }],
    })

    // Force reload by clearing in-memory cache only
    resetDigestStoreCache()
    const digests = await listDigests()
    expect(digests.find((d) => d.id === first.id)).toBeDefined()
  })
})
