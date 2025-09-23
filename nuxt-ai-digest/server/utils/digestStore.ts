import digestStorage from './storage/index'
import type { PersistedDigest } from './storage/types'

export type StoredDigest = PersistedDigest

export async function initDigestStore() {
  await digestStorage.configureDigestStore()
}

export async function saveDigest(payload: Omit<StoredDigest, 'id'>): Promise<StoredDigest> {
  await initDigestStore()
  return digestStorage.saveDigest(payload)
}

export async function updateDigest(id: string, updater: (current: StoredDigest) => StoredDigest | Promise<StoredDigest>): Promise<StoredDigest> {
  await initDigestStore()
  return digestStorage.updateDigest(id, updater)
}

export async function getDigest(id: string): Promise<StoredDigest | null> {
  await initDigestStore()
  return digestStorage.getDigest(id)
}

export async function listDigests(): Promise<StoredDigest[]> {
  await initDigestStore()
  return digestStorage.listDigests()
}

export async function clearDigests(): Promise<void> {
  await initDigestStore()
  await digestStorage.clearDigests()
}

export function resetDigestStoreCache(): void {
  digestStorage.resetDriverForTests()
}
