'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'

type JobType = { id: number; name: string; [k: string]: any }
type VenueMe = { id: number; [k: string]: any }

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isoRangeForEventDate(dateStr: string) {
  // dateStr: YYYY-MM-DD
  const startLocal = new Date(`${dateStr}T00:00:00`)
  const endLocal = new Date(`${dateStr}T23:59:00`)
  return { startTime: startLocal.toISOString(), endTime: endLocal.toISOString() }
}

export default function NewGigPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut } = useAuth()
  const canUse = useMemo(() => !!user && (user.role === 'horeca' || user.role === 'admin'), [user])

  const [venueId, setVenueId] = useState<number | null>(null)
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [jobTypeId, setJobTypeId] = useState<number | null>(null)

  const [title, setTitle] = useState('Incarico autonomo')
  const [eventDate, setEventDate] = useState('')
  const [payAmount, setPayAmount] = useState('60')
  const [currency] = useState('EUR')

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/login')
    if (user.role === 'worker') return router.replace('/worker/gigs')
  }, [loading, user, router])

  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    setEventDate(toDateInputValue(d))
  }, [])

  useEffect(() => {
    if (!canUse) return
    ;(async () => {
      setErr(null)
      try {
        // venueId
        const vRes = (await fetchAuth('/horeca-venues/me')) as Response
        if (vRes.status === 401) {
          signOut()
          router.replace('/login')
          return
        }
        if (!vRes.ok) throw new Error(await vRes.text())
        const v = (await vRes.json()) as VenueMe
        if (!v?.id) throw new Error('Committente non collegato a una venue.')
        setVenueId(Number(v.id))

        // job types
        const jtRes = await fetchAuth('/job-types')
        if (!jtRes.ok) throw new Error(await jtRes.text())
        const jtJson = await jtRes.json()
        const list = Array.isArray(jtJson?.value) ? jtJson.value : Array.isArray(jtJson) ? jtJson : []
        setJobTypes(list)
        if (list[0]?.id) setJobTypeId(Number(list[0].id))
      } catch (e: any) {
        setErr(e?.message || 'Setup fallito')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  async function createGig() {
    if (!venueId) return setErr('Venue mancante')
    if (!jobTypeId) return setErr('Categoria mancante')
    if (!eventDate) return setErr('Seleziona una data evento')

    const amt = Number(payAmount)
    if (!Number.isFinite(amt) || amt <= 0) return setErr('Il compenso deve essere un numero positivo')

    const { startTime, endTime } = isoRangeForEventDate(eventDate)

    setBusy(true)
    setErr(null)
    try {
      const body: any = {
        title,
        venueId,
        jobTypeId,
        startTime,
        endTime,
        payAmount: amt,
        currency,
      }

      const res = await fetchAuth('/gigs', { method: 'POST', body: JSON.stringify(body) })

      if (res.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!res.ok) throw new Error(await res.text())

      router.replace('/venue/gigs')
    } catch (e: any) {
      setErr(e?.message || 'Creazione incarico fallita')
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
            <div className="badge">Committente</div>
            <h1 className="mt-2 text-lg font-semibold">Nuovo incarico (demo)</h1>
            <p className="mt-1 text-sm text-zinc-700">
              Incarico autonomo (art. 2222 c.c.) tra Committente e Professionista occasionale. Solo Candidatura.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => router.back()} disabled={busy}>
              Indietro
            </button>
            <button className="btn" onClick={createGig} disabled={busy || !venueId || !jobTypeId || !eventDate}>
              {busy ? 'Creazione...' : 'Crea incarico'}
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Data evento</label>
            <input className="input mt-1" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Compenso a risultato (EUR)</label>
            <input className="input mt-1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
