import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { AuditService, type AuditContext } from '@/lib/auditStore'

export type VenueGigStatus = 'draft' | 'published' | 'accepted' | 'completed' | 'settled'

export type VenueGig = {
  id: number
  title: string
  status: VenueGigStatus
  payAmount: number
  currency: string
  startTime?: string
  endTime?: string
  venueId?: number | null
  createdAt: string
  updatedAt: string
  policySnapshotId?: string
  engagementId?: string
  preauthorizedAt?: string
  paymentConfirmedAt?: string
}

export type VenueApplication = {
  id: number
  gigId: number
  workerId: string
  workerName: string
  status: 'pending' | 'accepted' | 'completed' | 'rejected'
  appliedAt: string
}

type VenueStore = {
  gigs: VenueGig[]
  applications: VenueApplication[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'venue.json')

async function readStore(): Promise<VenueStore> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      gigs: Array.isArray(parsed?.gigs) ? parsed.gigs : [],
      applications: Array.isArray(parsed?.applications) ? parsed.applications : [],
    }
  } catch {
    return { gigs: [], applications: [] }
  }
}

async function writeStore(store: VenueStore) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2))
}

function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export async function listGigs() {
  const store = await readStore()
  return store.gigs.map((gig) => ({
    ...gig,
    applicationsCount: store.applications.filter((app) => app.gigId === gig.id).length,
  }))
}

export async function listPublishedGigs() {
  const store = await readStore()
  const published = store.gigs.filter((gig) => gig.status === 'published' || gig.status === 'accepted')
  return published.map((gig) => ({
    ...gig,
    applicationsCount: store.applications.filter((app) => app.gigId === gig.id).length,
  }))
}

export async function createGig(
  input: {
    title: string
    payAmount: number
    currency: string
    startTime?: string
    endTime?: string
    venueId?: number | null
  },
  ctx?: AuditContext,
) {
  const store = await readStore()
  const now = new Date().toISOString()
  const gig: VenueGig = {
    id: nextId(store.gigs),
    title: input.title,
    status: 'draft',
    payAmount: input.payAmount,
    currency: input.currency,
    startTime: input.startTime,
    endTime: input.endTime,
    venueId: input.venueId ?? null,
    createdAt: now,
    updatedAt: now,
  }
  store.gigs.push(gig)
  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'gig_created',
    entityType: 'gig',
    entityId: gig.id,
    payload: { status: gig.status, title: gig.title },
  })
  return { ...gig, applicationsCount: 0 }
}

export async function updateGig(id: number, patch: Partial<VenueGig>, ctx?: AuditContext) {
  const store = await readStore()
  const idx = store.gigs.findIndex((gig) => gig.id === id)
  if (idx === -1) return null
  const current = store.gigs[idx]
  const now = new Date().toISOString()
  const next: VenueGig = {
    ...current,
    title: patch.title ?? current.title,
    payAmount: patch.payAmount ?? current.payAmount,
    currency: patch.currency ?? current.currency,
    startTime: patch.startTime ?? current.startTime,
    endTime: patch.endTime ?? current.endTime,
    updatedAt: now,
  }

  store.gigs[idx] = next
  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'gig_updated',
    entityType: 'gig',
    entityId: next.id,
    payload: { title: next.title, payAmount: next.payAmount, currency: next.currency },
  })
  return {
    ...next,
    applicationsCount: store.applications.filter((app) => app.gigId === next.id).length,
  }
}

export async function publishGig(id: number, ctx?: AuditContext) {
  const store = await readStore()
  const idx = store.gigs.findIndex((gig) => gig.id === id)
  if (idx === -1) return null
  const current = store.gigs[idx]
  if (current.status !== 'draft') return { error: 'Transizione non valida' }
  const now = new Date().toISOString()
  const next: VenueGig = {
    ...current,
    status: 'published',
    preauthorizedAt: current.preauthorizedAt || now,
    updatedAt: now,
  }
  store.gigs[idx] = next
  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'gig_published',
    entityType: 'gig',
    entityId: next.id,
    payload: { fromStatus: current.status, toStatus: next.status },
  })
  return next
}

export async function deleteGig(id: number, ctx?: AuditContext) {
  const store = await readStore()
  const nextGigs = store.gigs.filter((gig) => gig.id !== id)
  if (nextGigs.length === store.gigs.length) return false
  store.gigs = nextGigs
  store.applications = store.applications.filter((app) => app.gigId !== id)
  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'gig_deleted',
    entityType: 'gig',
    entityId: id,
    payload: {},
  })
  return true
}

export async function listApplications(gigId: number) {
  const store = await readStore()
  return store.applications.filter((app) => app.gigId === gigId)
}

export async function listWorkerApplications(workerId: string) {
  const store = await readStore()
  return store.applications.filter((app) => app.workerId === workerId)
}

export async function applyToGig(
  gigId: number,
  workerId: string,
  workerName: string,
  ctx?: AuditContext,
) {
  const store = await readStore()
  const gig = store.gigs.find((g) => g.id === gigId)
  if (!gig) return { error: 'Gig non trovato' }
  if (gig.status !== 'published' && gig.status !== 'accepted') return { error: 'Gig non disponibile' }
  const existing = store.applications.find((app) => app.gigId === gigId && app.workerId === workerId)
  if (existing) return { error: 'Candidatura gia inviata', status: 409 }
  const now = new Date().toISOString()
  const application: VenueApplication = {
    id: nextId(store.applications),
    gigId,
    workerId,
    workerName,
    status: 'pending',
    appliedAt: now,
  }
  store.applications.push(application)
  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'application_created',
    entityType: 'application',
    entityId: application.id,
    payload: { gigId, status: application.status },
  })
  return application
}

export async function acceptApplication(id: number, ctx?: AuditContext) {
  const store = await readStore()
  const idx = store.applications.findIndex((app) => app.id === id)
  if (idx === -1) return null
  const current = store.applications[idx]
  if (current.status !== 'pending') return { error: 'Transizione non valida' }
  const updated = { ...current, status: 'accepted' as const }
  store.applications[idx] = updated
  const gigIdx = store.gigs.findIndex((gig) => gig.id === updated.gigId)
  if (gigIdx !== -1) {
    const gig = store.gigs[gigIdx]
    const nextGig: VenueGig = {
      ...gig,
      status: gig.status === 'published' ? 'accepted' : gig.status,
      updatedAt: new Date().toISOString(),
    }
    store.gigs[gigIdx] = nextGig
    await AuditService.log({
      ...ctx,
      action: 'gig_accepted',
      entityType: 'gig',
      entityId: nextGig.id,
      payload: { fromStatus: gig.status, toStatus: nextGig.status },
    })
  }
  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'application_accepted',
    entityType: 'application',
    entityId: updated.id,
    payload: { gigId: updated.gigId, fromStatus: current.status, toStatus: updated.status },
  })
  return updated
}

export async function completeApplication(id: number, workerId: string, ctx?: AuditContext) {
  const store = await readStore()
  const idx = store.applications.findIndex((app) => app.id === id)
  if (idx === -1) return null
  const current = store.applications[idx]
  if (current.workerId !== workerId) return { error: 'Non autorizzato', status: 403 }
  if (current.status !== 'accepted') return { error: 'Transizione non valida' }
  const updated = { ...current, status: 'completed' as const }
  store.applications[idx] = updated

  const gigIdx = store.gigs.findIndex((gig) => gig.id === updated.gigId)
  if (gigIdx !== -1) {
    const gig = store.gigs[gigIdx]
    const now = new Date().toISOString()
    const nextGig: VenueGig = {
      ...gig,
      status: 'completed',
      policySnapshotId: gig.policySnapshotId || `pol_${gig.id}`,
      engagementId: gig.engagementId || `eng_${gig.id}`,
      updatedAt: now,
    }
    store.gigs[gigIdx] = nextGig
    await AuditService.log({
      ...ctx,
      action: 'gig_completed',
      entityType: 'gig',
      entityId: nextGig.id,
      payload: { fromStatus: gig.status, toStatus: nextGig.status },
    })
  }

  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'application_completed',
    entityType: 'application',
    entityId: updated.id,
    payload: { gigId: updated.gigId, fromStatus: current.status, toStatus: updated.status },
  })
  return updated
}

export async function settleGig(id: number, ctx?: AuditContext) {
  const store = await readStore()
  const idx = store.gigs.findIndex((gig) => gig.id === id)
  if (idx === -1) return null
  const current = store.gigs[idx]
  if (current.status !== 'completed') return { error: 'Transizione non valida' }
  const now = new Date().toISOString()
  const next: VenueGig = {
    ...current,
    status: 'settled',
    paymentConfirmedAt: current.paymentConfirmedAt || now,
    updatedAt: now,
  }
  store.gigs[idx] = next
  await writeStore(store)
  await AuditService.log({
    ...ctx,
    action: 'gig_settled',
    entityType: 'gig',
    entityId: next.id,
    payload: { fromStatus: current.status, toStatus: next.status },
  })
  return next
}

export async function listHistory() {
  const store = await readStore()
  return store.gigs
    .filter((gig) => gig.status === 'completed' || gig.status === 'settled')
    .map((gig) => ({
      gigId: gig.id,
      title: gig.title,
      policySnapshotId: gig.policySnapshotId || `pol_${gig.id}`,
      engagementId: gig.engagementId || `eng_${gig.id}`,
      compensation: gig.payAmount,
      currency: gig.currency,
      preauthorizedAt: gig.preauthorizedAt || gig.updatedAt,
      paymentConfirmedAt: gig.paymentConfirmedAt || '',
    }))
}
