'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import ForbiddenScreen from '@/components/ForbiddenScreen'
import { useAuth } from '@/lib/auth'

type AuditEntry = {
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

export default function AdminPage() {
  const router = useRouter()
  const { user, loading, fetchAuth } = useAuth()

  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(25)
  const [cursors, setCursors] = useState<string[]>([''])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
  }, [loading, user, router])

  async function loadAudit(index: number) {
    setBusy(true)
    setErr(null)
    try {
      const cursor = cursors[index] || ''
      const query = new URLSearchParams()
      query.set('limit', String(pageSize))
      if (cursor) query.set('cursor', cursor)
      const res = (await fetchAuth(`/admin/audit?${query.toString()}`)) as Response
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { items: AuditEntry[]; nextCursor: string | null }
      setEntries(Array.isArray(data.items) ? data.items : [])
      setNextCursor(data.nextCursor || null)
      setPageIndex(index)
      if (data.nextCursor && index === cursors.length - 1) {
        setCursors((prev) => [...prev, data.nextCursor || ''])
      }
    } catch (e: any) {
      setErr(e?.message || 'Caricamento audit fallito')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    loadAudit(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>
  if (!isAdmin) return <ForbiddenScreen />

  return (
    <div className="mx-auto max-w-6xl px-4">
      <TopBar />
      <div className="card space-y-4">
        <div>
          <div className="badge">Admin</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Audit log</h1>
        </div>

        {err ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div> : null}

        <div className="flex items-center justify-between text-sm text-soft">
          <div>Pagina {pageIndex + 1}</div>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={busy || pageIndex <= 0} onClick={() => loadAudit(pageIndex - 1)}>
              Prev
            </button>
            <button className="btn-secondary" disabled={busy || !nextCursor} onClick={() => loadAudit(pageIndex + 1)}>
              Next
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs text-soft">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded border border-light bg-surface p-3">
              <div className="text-sm font-medium text-main">
                {entry.action} - {entry.entityType}#{entry.entityId}
              </div>
              <div>ts: {entry.ts}</div>
              <div>actor: {entry.actorUserId} ({entry.actorRole})</div>
              <div>ip: {entry.ip || '-'}</div>
              <div>ua: {entry.userAgent || '-'}</div>
              <div>payload: {entry.payloadJson}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
