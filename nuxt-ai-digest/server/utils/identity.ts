import type { H3Event } from 'h3'
import { getHeader } from 'h3'

function sanitizeInput(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.slice(0, 120)
}

export function resolveActor(event: H3Event, fallback?: string): string {
  const headerActor = getHeader(event, 'x-digest-actor') || getHeader(event, 'x-reviewer-id')
  const candidate = headerActor || fallback
  return sanitizeInput(candidate, 'anonymous')
}
