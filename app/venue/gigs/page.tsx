'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'

type Gig = {
  id: number
  title?: string
  publishStatus?: 'draft' | 'preauthorized' | 'published'
  payAmount?: string | number | null
  currency?: string
  startTime?: string
  endTime?: string
  [k: string]: any
}

type Booking = {
  id: number
  gigId: number
  workerUserId: number
  status: string
  [k: string]: any
}

function dateOnly(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString()
}

export default function VenueGigsPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut } = useAuth()

  const [gigs, setGigs] = useState<Gig[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const canUse = useMemo(() => !!user && (user.role === 'horeca' || user.role === 'admin'), [user])

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/login')
    if (user.role === 'worker') return router.replace('/worker/gigs')
  }, [loading, user, router])

  async function loadAll() {
    if (!canUse) return
    setBusy(true)
    setErr(null)
    try {
      const gRes = await fetchAuth('/gigs')
      if (gRes.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!gRes.ok) throw new Error(await gRes.text())
      const gJson = await gRes.json()
      setGigs(Array.isArray(gJson) ? gJson : [])

      const bRes = await fetchAuth('/bookings')
      if (bRes.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!bRes.ok) throw new Error(await bRes.text())
      const bJson = await bRes.json()
      setBookings(Array.isArray(bJson) ? bJson : [])
    } catch (e: any) {
      setErr(e?.message || 'Errore nel caricamento')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!canUse) return
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  const demoGig = gigs?.[0] ?? null

  async function preauthorize(id: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetchAuth(`/gigs/${id}/preauthorize`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      await loadAll()
    } catch (e: any) {
      setErr(e?.message || 'Preautorizzazione fallita')
    } finally {
      setBusy(false)
    }
  }

  async function publish(id: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetchAuth(`/gigs/${id}/publish`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      await loadAll()
    } catch (e: any) {
      setErr(e?.message || 'Pubblicazione fallita')
    } finally {
      setBusy(false)
    }
  }

  async function acceptBooking(id: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetchAuth(`/bookings/${id}/accept`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      await loadAll()
    } catch (e: any) {
      setErr(e?.message || 'Accettazione candidatura fallita')
    } finally {
      setBusy(false)
    }
  }

  const pendingForDemoGig =
    demoGig
      ? bookings.filter((b) => b.gigId === demoGig.id && String(b.status).toLowerCase() === 'pending').slice(0, 1)
      : []

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Committente</div>
            <h1 className="mt-2 text-lg font-semibold">Incarico autonomo (demo)</h1>
            <p className="mt-1 text-sm text-zinc-700">
              Incarico autonomo (art. 2222 c.c.) tra Committente e Professionista occasionale. Solo Candidatura.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => router.push('/venue/gigs/new')} disabled={busy}>
              Nuovo incarico
            </button>
            <button className="btn-secondary" onClick={loadAll} disabled={busy}>
              Aggiorna
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div>
        ) : null}

        {!demoGig && !busy ? (
          <div className="mt-4 text-sm text-zinc-600">Nessun incarico presente. Crea un nuovo incarico.</div>
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

              <div className="flex flex-col gap-2">
                <button
                  className="btn-secondary"
                  disabled={busy || demoGig.publishStatus !== 'draft'}
                  onClick={() => preauthorize(demoGig.id)}
                >
                  Preautorizza compenso
                </button>

                <button
                  className="btn"
                  disabled={busy || demoGig.publishStatus !== 'preauthorized'}
                  onClick={() => publish(demoGig.id)}
                >
                  Pubblica incarico
                </button>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="text-sm font-medium">Candidature (demo)</div>

              {pendingForDemoGig.length === 0 ? (
                <div className="mt-2 text-sm text-zinc-600">
                  Nessuna candidatura in attesa. Accedi come Professionista occasionale e invia la Candidatura.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {pendingForDemoGig.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                      <div className="text-sm">
                        <div className="font-medium">Candidatura #{b.id}</div>
                        <div className="text-xs text-zinc-500">Professionista occasionale (userId): {b.workerUserId}</div>
                      </div>
                      <button className="btn" disabled={busy} onClick={() => acceptBooking(b.id)}>
                        Accetta candidatura
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
