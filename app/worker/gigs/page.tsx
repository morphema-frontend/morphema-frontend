'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'

type Gig = {
  id: number
  title?: string
  publishStatus?: string
  payAmount?: string | number | null
  currency?: string
  startTime?: string
  [k: string]: any
}

function dateOnly(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString()
}

export default function WorkerGigsPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut } = useAuth()

  const [gigs, setGigs] = useState<Gig[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const canUse = useMemo(() => !!user && user.role === 'worker', [user])

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/login')
    if (user.role !== 'worker') return router.replace('/venue/gigs')
  }, [loading, user, router])

  async function loadGigs() {
    if (!canUse) return
    setBusy(true)
    setErr(null)
    try {
      const res = await fetchAuth('/gigs')
      if (res.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const list = Array.isArray(json) ? json : []
      // demo: prendi il primo pubblicato
      setGigs(list.filter((g: any) => String(g.publishStatus).toLowerCase() === 'published'))
    } catch (e: any) {
      setErr(e?.message || 'Errore nel caricamento')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!canUse) return
    loadGigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  const demoGig = gigs?.[0] ?? null

  async function apply(gigId: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetchAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify({ gigId }),
      })
      if (res.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!res.ok) throw new Error(await res.text())
      await loadGigs()
    } catch (e: any) {
      setErr(e?.message || 'Invio candidatura fallito')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Professionista occasionale</div>
            <h1 className="mt-2 text-lg font-semibold">Incarico autonomo (demo)</h1>
            <p className="mt-1 text-sm text-zinc-700">
              Incarico autonomo (art. 2222 c.c.) tra Committente e Professionista occasionale. Solo Candidatura.
            </p>
          </div>

          <button className="btn-secondary" onClick={loadGigs} disabled={busy}>
            Aggiorna
          </button>
        </div>

        {err ? (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div>
        ) : null}

        {!demoGig && !busy ? (
          <div className="mt-4 text-sm text-zinc-600">
            Nessun incarico pubblicato. Accedi come Committente e pubblica un incarico.
          </div>
        ) : null}

        {demoGig ? (
          <div className="mt-4 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm text-zinc-700">Data evento: {dateOnly(demoGig.startTime)}</div>
                <div className="text-sm text-zinc-700">
                  Compenso: {String(demoGig.payAmount ?? '-')} {demoGig.currency || 'EUR'}
                </div>
              </div>

              <button className="btn" disabled={busy} onClick={() => apply(demoGig.id)}>
                Invia candidatura
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
