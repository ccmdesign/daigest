import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface StoredDigest {
  id: string
  createdAt: string
  summary: {
    total: number
    durationMs: number
  }
  records: any[]
}

function getStorePath(): string {
  return process.env.NUXT_DIGEST_STORE_PATH
    ? join(process.cwd(), process.env.NUXT_DIGEST_STORE_PATH)
    : join(process.cwd(), 'data', 'digests.json')
}

let digestMap = new Map<string, StoredDigest>()
let initialized = false

async function ensureInitialized() {
  if (initialized) return
  try {
    const raw = await readFile(getStorePath(), 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      digestMap = new Map(parsed.map((item: StoredDigest) => [item.id, item]))
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to load digests store', error)
    }
  }
  initialized = true
}

async function persist() {
  const payload = JSON.stringify(Array.from(digestMap.values()), null, 2)
  const storePath = getStorePath()
  const dir = dirname(storePath)
  await mkdir(dir, { recursive: true })
  await writeFile(storePath, payload, 'utf-8')
}

function generateId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

export async function saveDigest(payload: Omit<StoredDigest, 'id'>): Promise<StoredDigest> {
  await ensureInitialized()
  const id = generateId()
  const digest: StoredDigest = { id, ...payload }
  digestMap.set(id, digest)
  await persist()
  return digest
}

export async function getDigest(id: string): Promise<StoredDigest | null> {
  await ensureInitialized()
  return digestMap.get(id) || null
}

export async function listDigests(): Promise<StoredDigest[]> {
  await ensureInitialized()
  return Array.from(digestMap.values())
}

export async function clearDigests(): Promise<void> {
  await ensureInitialized()
  digestMap.clear()
  initialized = true
  const storePath = getStorePath()
  const dir = dirname(storePath)
  await mkdir(dir, { recursive: true })
  await writeFile(storePath, '[]', 'utf-8')
}

export function resetDigestStoreCache(): void {
  digestMap = new Map()
  initialized = false
}
