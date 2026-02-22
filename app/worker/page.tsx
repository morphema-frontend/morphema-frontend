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
  venue?: { name?: string; [k: string]: any }
  venueName?: string
  venueId?: number
  insuranceProductId?: number | null
  insuranceSnapshot?: { name?: string; [k: string]: any } | null
  contractTemplateId?: number | null
  contractSnapshot?: { name?: string; [k: string]: any } | null
  [k: string]: any
}
type Booking = { id: number; gigId?: number; status?: string; [k: string]: any }

function normalizeList<T>(json: any): T[] {
  if (Array.isArray(json?.value)) return json.value as T[]
  if (Array.isArray(json)) return json as T[]
  return []
}

export default function WorkerLandingPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut } = useAuth()
  const canUse = useMemo(() => !!user && user.role === 'worker', [user])

  const [publishedCount, setPublishedCount] = useState(0)
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [acceptedCount, setAcceptedCount] = useState(0)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/login')
    if (user.role !== 'worker') return router.replace('/venue')
  }, [loading, user, router])

  async function loadSummary() {
    if (!canUse) return
    setBusy(true)
    setErr(null)
    try {
      const gigsRes = await fetchAuth('/gigs')
      if (gigsRes.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      const gigs = normalizeList<Gig>(await gigsRes.json())
      setGigs(gigs)
      setPublishedCount(gigs.filter((g) => String(g.publishStatus).toLowerCase() === 'published').length)

      const bookingsRes = await fetchAuth('/bookings')
      if (bookingsRes.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      const bookings = normalizeList<Booking>(await bookingsRes.json())
      setBookings(bookings)
      const accepted = bookings.filter((b) => {
        const status = String(b.status || '').toLowerCase()
        return status === 'accepted' || status === 'confirmed'
      })
      setApplicationsCount(bookings.length)
      setAcceptedCount(accepted.length)
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

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  const gigMap = gigs.reduce(
    (acc, g) => {
      acc[g.id] = g
      return acc
    },
    {} as Record<number, Gig>
  )
  const acceptedBooking = bookings.find((b) => {
    const status = String(b.status || '').toLowerCase()
    return status === 'accepted' || status === 'confirmed'
  })
  const acceptedGig = acceptedBooking?.gigId ? gigMap[acceptedBooking.gigId] : null
  const applicationRows = bookings
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      {acceptedGig ? (
        <div className="card card-accent mb-4 border-amber-400/30 bg-amber-400/10">
          <div className="text-lg font-semibold text-amber-200">Sei stato selezionato {'\u2705'}</div>
          <div className="mt-2 text-sm text-amber-100">
            {acceptedGig.title || 'Prestazione autonoma'} -{' '}
            {acceptedGig.venue?.name || acceptedGig.venueName || acceptedGig.venueId || 'Venue'}
          </div>
          <div className="mt-2 text-sm text-amber-100">
            Turno: {acceptedGig.startTime ? new Date(acceptedGig.startTime).toLocaleDateString() : '-'} -{' '}
            {String(acceptedGig.payAmount ?? '-')} {acceptedGig.currency || 'EUR'}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {acceptedGig.contractSnapshot?.name || acceptedGig.contractTemplateId ? (
              <span className="badge">
                Contratto: {acceptedGig.contractSnapshot?.name || `Template #${acceptedGig.contractTemplateId}`}
              </span>
            ) : null}
            {acceptedGig.insuranceSnapshot?.name || acceptedGig.insuranceProductId ? (
              <span className="badge">
                Assicurazione: {acceptedGig.insuranceSnapshot?.name || `Prodotto #${acceptedGig.insuranceProductId}`}
              </span>
            ) : null}
          </div>
          <div className="mt-3 rounded border border-amber-200/40 bg-amber-400/10 p-2 text-xs text-amber-100">
            Prestazione autonoma (art. 2222 c.c.). Responsabilita' fiscale al lavoratore.
          </div>
        </div>
      ) : null}

      <div className="card card-accent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Professionista occasionale</div>
            <h1 className="mt-2 text-lg font-semibold text-amber-50">Dashboard professionista</h1>
            <p className="mt-1 text-sm text-zinc-300">
              Prestazione autonoma (art. 2222 c.c.) tra Committente e Professionista. Solo Candidatura.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={loadSummary} disabled={busy}>
              Aggiorna
            </button>
            <button className="btn" onClick={() => router.push('/worker/gigs')}>
              Trova incarichi
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded border border-red-200/40 bg-red-400/10 p-3 text-sm text-red-200">{err}</div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Incarichi pubblicati</div>
            <div className="mt-2 text-2xl font-semibold text-amber-100">{publishedCount}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Candidature inviate</div>
            <div className="mt-2 text-2xl font-semibold text-amber-100">{applicationsCount}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Accettazioni</div>
            <div className="mt-2 text-2xl font-semibold text-amber-100">{acceptedCount}</div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="badge">Le mie candidature</div>
            <div className="mt-2 text-sm text-zinc-300">Stato aggiornato sulle candidature inviate.</div>
          </div>
          <button className="btn-secondary" onClick={loadSummary} disabled={busy}>
            Aggiorna
          </button>
        </div>

        {applicationRows.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-400">Nessuna candidatura inviata.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {applicationRows.map((b) => {
              const status = String(b.status || '').toLowerCase()
              const label =
                status === 'pending'
                  ? 'In revisione'
                  : status === 'accepted' || status === 'confirmed'
                  ? 'Accettato'
                  : status === 'rejected'
                  ? 'Non selezionato'
                  : status || '-'
              const gig = b.gigId ? gigMap[b.gigId] : null
              const highlight = status === 'accepted' || status === 'confirmed'
              return (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
                >
                  <div className="text-sm">
                    <div className="font-medium text-amber-50">{gig?.title || `Gig #${b.gigId ?? '-'}`}</div>
                    <div className="text-xs text-zinc-400">
                      {gig?.venue?.name || gig?.venueName || gig?.venueId || 'Venue'} -{' '}
                      {gig?.startTime ? new Date(gig.startTime).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  <span
                    className={`badge ${highlight ? 'border-amber-300/60 bg-amber-400/20 text-amber-100' : ''}`}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
