import type { UserMe } from './types'
import { getStoredTokens } from './api'

type AuditPayload = {
  action: string
  entityType: string
  entityId?: string | number
  payload?: any
}

export async function logAuditClient(
  payload: AuditPayload,
  user?: UserMe | null,
  actorOverride?: { actorUserId?: string; actorRole?: string; actorEmail?: string },
) {
  if (typeof window === 'undefined') return
  const actorUserId = actorOverride?.actorUserId ?? (user ? String(user.id) : undefined)
  const actorRole = actorOverride?.actorRole ?? user?.role
  const actorEmail = actorOverride?.actorEmail ?? user?.email
  try {
    const { accessToken } = getStoredTokens()
    await fetch('/api/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(actorUserId ? { 'x-actor-id': actorUserId } : {}),
        ...(actorRole ? { 'x-actor-role': actorRole } : {}),
        ...(actorEmail ? { 'x-actor-email': actorEmail } : {}),
      },
      body: JSON.stringify({
        ...payload,
        actorUserId,
        actorRole,
        actorEmail,
      }),
    })
  } catch {
    // best-effort logging
  }
}
