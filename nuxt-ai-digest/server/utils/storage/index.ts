import { JsonDigestStoreDriver } from './jsonDriver'
import type { DigestStoreDriver, DigestStoreConfig, PersistedDigest } from './types'

let driver: DigestStoreDriver | null = null

function resolveDriver(): DigestStoreDriver {
  if (driver) return driver

  // Placeholder for future driver resolution (SQLite, Supabase, etc.)
  driver = new JsonDigestStoreDriver()
  return driver
}

async function configureDigestStore(config?: Partial<DigestStoreConfig>) {
  if (config?.driver) {
    driver = config.driver
  }
  await resolveDriver().init()
}

async function saveDigest(payload: Omit<PersistedDigest, 'id'>): Promise<PersistedDigest> {
  const store = resolveDriver()
  await store.init()
  return store.saveDigest(payload)
}

async function updateDigest(
  id: string,
  updater: (current: PersistedDigest) => PersistedDigest | Promise<PersistedDigest>,
): Promise<PersistedDigest> {
  const store = resolveDriver()
  await store.init()
  return store.updateDigest(id, updater)
}

async function getDigest(id: string): Promise<PersistedDigest | null> {
  const store = resolveDriver()
  await store.init()
  return store.getDigest(id)
}

async function listDigests(): Promise<PersistedDigest[]> {
  const store = resolveDriver()
  await store.init()
  return store.listDigests()
}

async function clearDigests(): Promise<void> {
  const store = resolveDriver()
  await store.init()
  await store.clearDigests()
}

function resetDriverForTests(): void {
  driver = null
}

export default {
  configureDigestStore,
  saveDigest,
  updateDigest,
  getDigest,
  listDigests,
  clearDigests,
  resetDriverForTests,
}
