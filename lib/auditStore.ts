import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getAuthUserFromRequest } from '@/lib/serverAuth'

export type AuditEntry = {
  id: number
  ts: string
  actorUserId: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  payloadJson: string
  ip: string
  userAgent: string
}

export type AuditContext = {
  actorUserId?: string
  actorRole?: string
  ip?: string
  userAgent?: string
}

export type AuditQuery = {
  limit?: number
  cursor?: string | null
  action?: string | null
  actorUserId?: string | null
  entityType?: string | null
  entityId?: string | null
  fromTs?: string | null
  toTs?: string | null
  q?: string | null
}

function auditDataDir() {
  return process.env.AUDIT_DATA_DIR || path.join(process.cwd(), 'data')
}

function auditFilePath() {
  return path.join(auditDataDir(), 'audit.json')
}

function normalizeString(value: unknown, fallback = '') {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number') return String(value)
  return fallback
}

function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

async function readAudit(): Promise<AuditEntry[]> {
  try {
    const raw = await readFile(auditFilePath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeAudit(entries: AuditEntry[]) {
  const dir = auditDataDir()
  await mkdir(dir, { recursive: true })
  await writeFile(auditFilePath(), JSON.stringify(entries, null, 2))
}

export async function logAudit(event: {
  actorUserId?: string
  actorRole?: string
  action: string
  entityType: string
  entityId?: string | number
  payload?: any
  ip?: string
  userAgent?: string
}) {
  const entries = await readAudit()
  const entry: AuditEntry = {
    id: nextId(entries),
    ts: new Date().toISOString(),
    actorUserId: normalizeString(event.actorUserId, 'unknown'),
    actorRole: normalizeString(event.actorRole, 'unknown'),
    action: normalizeString(event.action, 'unknown'),
    entityType: normalizeString(event.entityType, 'unknown'),
    entityId: normalizeString(event.entityId, ''),
    payloadJson: JSON.stringify(event.payload ?? {}),
    ip: normalizeString(event.ip, ''),
    userAgent: normalizeString(event.userAgent, ''),
  }
  await writeAudit([...entries, entry])
  return entry
}

function parseCursor(value?: string | null) {
  if (!value) return null
  const sepIndex = value.lastIndexOf(':')
  if (sepIndex <= 0) return null
  const tsPart = value.slice(0, sepIndex)
  const idPart = value.slice(sepIndex + 1)
  if (!tsPart || !idPart) return null
  const id = Number(idPart)
  if (!Number.isFinite(id)) return null
  return { ts: tsPart, id }
}

function isBeforeCursor(entry: AuditEntry, cursor: { ts: string; id: number }) {
  if (entry.ts < cursor.ts) return true
  if (entry.ts > cursor.ts) return false
  return entry.id < cursor.id
}

export async function listAudit(query: AuditQuery = {}) {
  const entries = await readAudit()
  const limit = Math.max(1, Math.min(200, Number(query.limit || 50)))
  const cursor = parseCursor(query.cursor)
  const fromTs = query.fromTs ? Date.parse(query.fromTs) : null
  const toTs = query.toTs ? Date.parse(query.toTs) : null
  const q = query.q?.toLowerCase().trim()

  const filtered = entries.filter((entry) => {
    if (query.action && entry.action !== query.action) return false
    if (query.actorUserId && entry.actorUserId !== query.actorUserId) return false
    if (query.entityType && entry.entityType !== query.entityType) return false
    if (query.entityId && entry.entityId !== query.entityId) return false
    if (fromTs && Date.parse(entry.ts) < fromTs) return false
    if (toTs && Date.parse(entry.ts) > toTs) return false
    if (q) {
      const haystack = [
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.actorUserId,
        entry.payloadJson,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (cursor && !isBeforeCursor(entry, cursor)) return false
    return true
  })

  const sorted = filtered.sort((a, b) => {
    if (a.ts === b.ts) return b.id - a.id
    return a.ts < b.ts ? 1 : -1
  })

  const items = sorted.slice(0, limit)
  const last = items[items.length - 1]
  const nextCursor = last && sorted.length > limit ? `${last.ts}:${last.id}` : null

  return { items, nextCursor }
}

export async function auditContextFromRequest(req: Request): Promise<AuditContext> {
  const authUser = await getAuthUserFromRequest(req)
  const authHeader = req.headers.get('authorization') || ''
  const actorFromHeader = authHeader.replace(/^Bearer\s+/i, '')
  const actorUserId = authUser ? String(authUser.id) : actorFromHeader || 'unknown'
  const actorRole = authUser?.role || 'unknown'
  const ip = req.headers.get('x-forwarded-for') || ''
  const userAgent = req.headers.get('user-agent') || ''
  return { actorUserId, actorRole, ip, userAgent }
}

export const AuditService = {
  log: logAudit,
}
