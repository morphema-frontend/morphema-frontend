'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'
import { isVenueRole } from '@/lib/roles'

type Gig = {
  id: number
  title?: string
  publishStatus?: 'draft' | 'preauthorized' | 'published'
  payAmount?: string | number | null
  currency?: string
  startTime?: string
  [k: string]: any
}

type Booking = { id: number; gigId: number; status?: string; [k: string]: any }

function dateOnly(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString()
}

function normalizeList<T>(json: any): T[] {
  if (Array.isArray(json?.value)) return json.value as T[]
  if (Array.isArray(json)) return json as T[]
  return []
}

async function readError(res: Response) {
  const text = await res.text()
  return text || `${res.status} ${res.statusText}`
}

export default function VenueLandingPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut } = useAuth()

  const [gigs, setGigs] = useState<Gig[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [venueId, setVenueId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const canUse = useMemo(() => !!user && isVenueRole(user.role), [user])

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/login')
    if (user.role === 'worker') return router.replace('/worker')
  }, [loading, user, router])

  async function resolveVenueId() {
    if (venueId) return venueId
    const vRes = (await fetchAuth('/horeca-venues/me')) as Response
    if (vRes.status === 401) {
      signOut()
      router.replace('/login')
      return null
    }
    if (!vRes.ok) throw new Error(await readError(vRes))
    const vJson = (await vRes.json()) as any
    const v = Array.isArray(vJson) ? vJson[0] : vJson
    if (!v?.id) throw new Error('Committente non collegato a una venue.')
    const id = Number(v.id)
    setVenueId(id)
    return id
  }

  async function loadSummary() {
    if (!canUse) return
    setBusy(true)
    setErr(null)
    try {
      const venueIdValue = await resolveVenueId()
      if (!venueIdValue) return

      const gRes = await fetchAuth(`/gigs?venueId=${venueIdValue}`)
      if (gRes.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!gRes.ok) throw new Error(await readError(gRes))
      setGigs(normalizeList<Gig>(await gRes.json()))

      const bRes = await fetchAuth('/bookings')
      if (bRes.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!bRes.ok) throw new Error(await readError(bRes))
      setBookings(normalizeList<Booking>(await bRes.json()))
    } catch (e: any) {
      setErr(e?.message || 'Errore nel caricamento')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!canUse) return
    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  async function preauthorize(id: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetchAuth(`/gigs/${id}/preauthorize`, { method: 'POST' })
      if (!res.ok) throw new Error(await readError(res))
      await loadSummary()
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
      if (!res.ok) throw new Error(await readError(res))
      await loadSummary()
    } catch (e: any) {
      setErr(e?.message || 'Pubblicazione fallita')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  const totalGigs = gigs.length
  const published = gigs.filter((g) => g.publishStatus === 'published').length
  const pendingBookings = bookings.filter((b) => String(b.status).toLowerCase() === 'pending').length
  const lastGig = gigs[0] ?? null
  const gigRows = gigs.slice(0, 5)

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      <div className="card card-accent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Committente</div>
            <h1 className="mt-2 text-lg font-semibold text-amber-50">Dashboard committente</h1>
            <p className="mt-1 text-sm text-zinc-300">
              Prestazione autonoma (art. 2222 c.c.) tra Committente e Professionista. Solo Candidatura.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={loadSummary} disabled={busy}>
              Aggiorna
            </button>
            <button className="btn" onClick={() => router.push('/venue/gigs/new')}>
              Crea incarico
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded border border-red-200/40 bg-red-400/10 p-3 text-sm text-red-200">{err}</div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Incarichi totali</div>
            <div className="mt-2 text-2xl font-semibold text-amber-100">{totalGigs}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Pubblicati</div>
            <div className="mt-2 text-2xl font-semibold text-amber-100">{published}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Candidature in attesa</div>
            <div className="mt-2 text-2xl font-semibold text-amber-100">{pendingBookings}</div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Ultimo incarico</div>
            <div className="mt-2 text-sm text-zinc-300">Gestisci stato e pubblicazione.</div>
          </div>
          <button className="btn-secondary" onClick={() => router.push('/venue/gigs')}>
            Apri lista incarichi
          </button>
        </div>

        {!lastGig ? (
          <div className="mt-3 text-sm text-zinc-400">Nessun incarico presente. Crea un nuovo incarico.</div>
        ) : (
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm text-zinc-300">Stato: {lastGig.publishStatus || '-'}</div>
                <div className="text-sm text-zinc-300">Data evento: {dateOnly(lastGig.startTime)}</div>
                <div className="text-sm text-zinc-300">
                  Compenso: {String(lastGig.payAmount ?? '-')} {lastGig.currency || 'EUR'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="btn-secondary"
                  disabled={busy || lastGig.publishStatus !== 'draft'}
                  onClick={() => preauthorize(lastGig.id)}
                >
                  Preautorizza compenso
                </button>
                <button
                  className="btn"
                  disabled={busy || lastGig.publishStatus !== 'preauthorized'}
                  onClick={() => publish(lastGig.id)}
                >
                  Pubblica incarico
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Lista incarichi</div>
            <div className="mt-2 text-sm text-zinc-300">Azioni rapide su draft e preautorizzati.</div>
          </div>
          <button className="btn-secondary" onClick={loadSummary} disabled={busy}>
            Aggiorna
          </button>
        </div>

        {gigRows.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-400">Nessun incarico presente.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {gigRows.map((gig) => (
              <div
                key={gig.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
              >
                <div className="text-sm">
                  <div className="font-medium text-amber-50">{gig.title || `Incarico #${gig.id}`}</div>
                  <div className="text-xs text-zinc-400">
                    Stato: {gig.publishStatus || '-'} - {dateOnly(gig.startTime)} -{' '}
                    {String(gig.payAmount ?? '-')} {gig.currency || 'EUR'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    disabled={busy || gig.publishStatus !== 'draft'}
                    onClick={() => preauthorize(gig.id)}
                  >
                    Preautorizza
                  </button>
                  <button
                    className="btn"
                    disabled={busy || gig.publishStatus !== 'preauthorized'}
                    onClick={() => publish(gig.id)}
                  >
                    Pubblica
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
