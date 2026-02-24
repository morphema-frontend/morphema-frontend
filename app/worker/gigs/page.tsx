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
  endTime?: string
  jobTypeId?: number | null
  venue?: { name?: string; [k: string]: any }
  venueName?: string
  venueId?: number
  insuranceProductId?: number | null
  insuranceSnapshot?: { name?: string; [k: string]: any } | null
  contractTemplateId?: number | null
  contractSnapshot?: { name?: string; [k: string]: any } | null
  [k: string]: any
}

type JobType = {
  id: number
  name: string
  eventOnly?: boolean
  isEventOnly?: boolean
  riskLevel?: string
  group?: string
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

function normalizeCatalog(json: any): JobType[] {
  if (Array.isArray(json?.value)) return json.value as JobType[]
  if (Array.isArray(json?.items)) return json.items as JobType[]
  if (Array.isArray(json)) return json as JobType[]
  if (json && typeof json === 'object') {
    const core = Array.isArray(json.core) ? json.core : []
    const eventOnly = Array.isArray(json.eventOnly) ? json.eventOnly : []
    return [...core, ...eventOnly] as JobType[]
  }
  return []
}

async function readError(res: Response) {
  const text = await res.text()
  if (!text) return `${res.status} ${res.statusText}`
  try {
    const parsed = JSON.parse(text)
    return parsed?.message || parsed?.error || text
  } catch {
    return text
  }
}

function isAlreadyApplied(message: string) {
  const msg = message.toLowerCase()
  return msg.includes('already') || msg.includes('gia') || msg.includes('esiste') || msg.includes('exist')
}

export default function WorkerGigsPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut } = useAuth()

  const [allGigs, setAllGigs] = useState<Gig[]>([])
  const [publishedGigs, setPublishedGigs] = useState<Gig[]>([])
  const [jobTypeMap, setJobTypeMap] = useState<Record<number, string>>({})
  const [appliedIds, setAppliedIds] = useState<Record<number, boolean>>({})
  const [bookingStatus, setBookingStatus] = useState<Record<number, string>>({})
  const [bookings, setBookings] = useState<Booking[]>([])
  const [polling, setPolling] = useState(false)
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const canUse = useMemo(() => !!user && user.role === 'worker', [user])

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/login')
    if (user.role !== 'worker') return router.replace('/venue/gigs')
  }, [loading, user, router])

  async function loadApplications() {
    if (!canUse) return
    const bRes = await fetchAuth('/bookings')
    if (bRes.status === 401) {
      signOut()
      router.replace('/login')
      return
    }
    if (!bRes.ok) throw new Error(await readError(bRes))
    const bList = normalizeList<Booking>(await bRes.json())
    const applied: Record<number, boolean> = {}
    const statusMap: Record<number, string> = {}
    bList.forEach((b) => {
      if (!b?.gigId) return
      applied[Number(b.gigId)] = true
      if (b.status) statusMap[Number(b.gigId)] = String(b.status).toLowerCase()
    })
    setAppliedIds(applied)
    setBookingStatus(statusMap)
    setBookings(bList)
    return bList
  }

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
      if (!res.ok) throw new Error(await readError(res))
      const json = await res.json()
      const list = Array.isArray(json) ? json : []
      setAllGigs(list)
      setPublishedGigs(list.filter((g: any) => String(g.publishStatus).toLowerCase() === 'published'))

      const jtRes = await fetchAuth('/job-types/catalog')
      if (jtRes.ok) {
        const jtList = normalizeCatalog(await jtRes.json())
        const map: Record<number, string> = {}
        jtList.forEach((jt) => {
          if (jt?.id) map[Number(jt.id)] = jt.name
        })
        setJobTypeMap(map)
      }

      await loadApplications()
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

  useEffect(() => {
    if (!polling) return
    if (!pollStartedAt) return
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (document.visibilityState !== 'visible') {
        timer = setTimeout(tick, 5000)
        return
      }
      const latest = (await loadApplications()) || []
      const accepted = latest.some((b) => {
        const status = String(b.status || '').toLowerCase()
        return status === 'accepted' || status === 'confirmed'
      })
      const elapsed = Date.now() - pollStartedAt
      if (accepted || elapsed > 120000) {
        setPolling(false)
        return
      }
      timer = setTimeout(tick, 5000)
    }

    timer = setTimeout(tick, 5000)
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [polling, pollStartedAt, bookings])

  const demoGig = publishedGigs.find((g) => bookingStatus[g.id]) ?? publishedGigs?.[0] ?? null
  const demoGigStatus = demoGig ? bookingStatus[demoGig.id] : ''
  const acceptedStatus = demoGigStatus === 'accepted' || demoGigStatus === 'confirmed'
  const gigById = useMemo(() => {
    const map: Record<number, Gig> = {}
    allGigs.forEach((g) => {
      map[g.id] = g
    })
    return map
  }, [allGigs])

  const acceptedBooking = bookings.find((b) => {
    const status = String(b.status || '').toLowerCase()
    return status === 'accepted' || status === 'confirmed'
  })
  const acceptedGig = acceptedBooking ? gigById[acceptedBooking.gigId] : null

  async function apply(gigId: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetchAuth('/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId }),
      })
      if (res.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (res.ok) {
        setAppliedIds((prev) => ({ ...prev, [gigId]: true }))
        setPolling(true)
        setPollStartedAt(Date.now())
        await loadGigs()
        return
      }
      const body = await readError(res)
      if (res.status === 409 || (res.status === 400 && isAlreadyApplied(body))) {
        setAppliedIds((prev) => ({ ...prev, [gigId]: true }))
        setPolling(true)
        setPollStartedAt(Date.now())
        return
      }
      throw new Error(body)
    } catch (e: any) {
      setErr(e?.message || 'Invio candidatura fallito')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

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
            {acceptedGig.title || 'Prestazione autonoma'} - {acceptedGig.venue?.name || acceptedGig.venueName || acceptedGig.venueId || 'Venue'}
          </div>
          <div className="mt-2 text-sm text-amber-100">
            Turno: {dateOnly(acceptedGig.startTime)} - {String(acceptedGig.payAmount ?? '-')} {acceptedGig.currency || 'EUR'}
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

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Professionista occasionale</div>
            <h1 className="mt-2 text-lg font-semibold">Incarico autonomo (demo)</h1>
            <p className="mt-1 text-sm text-zinc-300">
              Prestazione autonoma (art. 2222 c.c.) tra Committente e Professionista. Solo Candidatura.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={loadGigs} disabled={busy}>
              Aggiorna
            </button>
            <button className="btn-secondary" onClick={loadApplications} disabled={busy}>
              Refresh candidature
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded border border-red-200/40 bg-red-400/10 p-3 text-sm text-red-200">{err}</div>
        ) : null}

        {!demoGig && !busy ? (
          <div className="mt-4 text-sm text-zinc-400">
            Nessun incarico pubblicato. Accedi come Committente e pubblica un incarico.
          </div>
        ) : null}

        {demoGig ? (
          <div className="mt-4 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm text-zinc-300">
                  Prestazione: {jobTypeMap[Number(demoGig.jobTypeId)] || 'Categoria non disponibile'}
                </div>
                <div className="text-sm text-zinc-300">Data evento: {dateOnly(demoGig.startTime)}</div>
                <div className="text-sm text-zinc-300">
                  Compenso: {String(demoGig.payAmount ?? '-')} {demoGig.currency || 'EUR'}
                </div>
              </div>

              <button className="btn" disabled={busy || appliedIds[demoGig.id]} onClick={() => apply(demoGig.id)}>
                {appliedIds[demoGig.id] ? 'Candidatura inviata' : 'Invia candidatura'}
              </button>
            </div>
            {acceptedStatus ? (
              <div className="mt-3 rounded border border-emerald-200/40 bg-emerald-400/10 p-2 text-sm text-emerald-200">
                Candidatura accettata.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="badge">Le mie candidature</div>
            <div className="mt-2 text-sm text-zinc-300">
              Stato aggiornato automatico dopo l&apos;invio (polling leggero).
            </div>
          </div>
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
              const gig = gigById[b.gigId]
              const highlight = status === 'accepted' || status === 'confirmed'
              return (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                  <div className="text-sm">
                    <div className="font-medium text-amber-50">{gig?.title || `Gig #${b.gigId}`}</div>
                    <div className="text-xs text-zinc-400">
                      {gig?.venue?.name || gig?.venueName || gig?.venueId || 'Venue'} - {dateOnly(gig?.startTime)}
                    </div>
                  </div>
                  <span className={`badge ${highlight ? 'border-amber-300/60 bg-amber-400/20 text-amber-100' : ''}`}>
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






