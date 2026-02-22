'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'
import { isVenueRole } from '@/lib/roles'

type JobType = {
  id: number
  name: string
  eventOnly?: boolean
  isEventOnly?: boolean
  riskLevel?: string
  group?: string
  [k: string]: any
}
type VenueMe = { id: number; [k: string]: any }
type ContractTemplate = { id: number; name: string; [k: string]: any }
type InsuranceProduct = { id: number; name: string; [k: string]: any }

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

function isEventOnlyJobType(item: JobType) {
  if (typeof item.eventOnly === 'boolean') return item.eventOnly
  if (typeof item.isEventOnly === 'boolean') return item.isEventOnly
  const group = String(item.group || '').toLowerCase()
  if (group.includes('event')) return true
  const risk = String(item.riskLevel || '').toLowerCase()
  return risk === 'medium' || risk === 'event_only' || risk === 'event-only'
}

async function readError(res: Response) {
  const text = await res.text()
  return text || `${res.status} ${res.statusText}`
}

export default function NewGigPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut, apiBase } = useAuth()
  const canUse = useMemo(() => !!user && isVenueRole(user.role), [user])

  const [venueId, setVenueId] = useState<number | null>(null)
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [jobTypeId, setJobTypeId] = useState<number | null>(null)
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([])
  const [contractTemplateId, setContractTemplateId] = useState<number | null>(null)
  const [insuranceProducts, setInsuranceProducts] = useState<InsuranceProduct[]>([])
  const [insuranceProductId, setInsuranceProductId] = useState<number | null>(null)

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
        if (!vRes.ok) throw new Error(await readError(vRes))
        const vJson = (await vRes.json()) as VenueMe | VenueMe[]
        const v = Array.isArray(vJson) ? vJson[0] : vJson
        if (!v?.id) throw new Error('Committente non collegato a una venue.')
        setVenueId(Number(v.id))

        // job types
        const jtRes = await fetchAuth('/job-types/catalog')
        if (!jtRes.ok) throw new Error(await readError(jtRes))
        const jtList = normalizeCatalog(await jtRes.json())
        setJobTypes(jtList)
        const firstCore = jtList.find((jt) => !isEventOnlyJobType(jt))
        const firstAny = firstCore || jtList[0]
        if (firstAny?.id) setJobTypeId((prev) => prev ?? Number(firstAny.id))

        // contract templates (auth required)
        const ctRes = await fetchAuth('/contract-templates')
        if (!ctRes.ok) throw new Error(await readError(ctRes))
        const ctList = normalizeList<ContractTemplate>(await ctRes.json())
        setContractTemplates(ctList)
        if (ctList[0]?.id) setContractTemplateId((prev) => prev ?? Number(ctList[0].id))

        // insurance products (try public, fallback to auth)
        let ipRes: Response | null = null
        try {
          ipRes = await fetch(`${apiBase}/insurance/products`)
        } catch (e) {
          ipRes = null
        }
        if (ipRes && (ipRes.status === 401 || ipRes.status === 403)) {
          ipRes = await fetchAuth('/insurance/products')
        }
        if (ipRes && ipRes.ok) {
          const ipList = normalizeList<InsuranceProduct>(await ipRes.json())
          setInsuranceProducts(ipList)
          if (ipList[0]?.id) setInsuranceProductId((prev) => prev ?? Number(ipList[0].id))
        }
      } catch (e: any) {
        setErr(e?.message || 'Setup fallito')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  async function createGig() {
    if (!venueId) return setErr('Venue mancante')
    if (!jobTypeId) return setErr('Categoria mancante')
    if (!contractTemplateId) return setErr('Template contratto mancante')
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
        contractTemplateId,
      }
      if (insuranceProductId) body.insuranceProductId = insuranceProductId

      const res = await fetchAuth('/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 401) {
        signOut()
        router.replace('/login')
        return
      }
      if (!res.ok) throw new Error(await readError(res))

      router.replace('/venue/gigs')
    } catch (e: any) {
      setErr(e?.message || 'Creazione incarico fallita')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  const groupedJobTypes = jobTypes.reduce(
    (acc, jt) => {
      if (isEventOnlyJobType(jt)) acc.eventOnly.push(jt)
      else acc.core.push(jt)
      return acc
    },
    { core: [] as JobType[], eventOnly: [] as JobType[] }
  )
  const selectedJobType = jobTypes.find((jt) => jt.id === jobTypeId) || null
  const selectedEventOnly = selectedJobType ? isEventOnlyJobType(selectedJobType) : false

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Committente</div>
            <h1 className="mt-2 text-lg font-semibold">Nuovo incarico (demo)</h1>
            <p className="mt-1 text-sm text-zinc-300">
              Prestazione autonoma (art. 2222 c.c.) tra Committente e Professionista. Solo Candidatura.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => router.back()} disabled={busy}>
              Indietro
            </button>
            <button
              className="btn"
              onClick={createGig}
              disabled={busy || !venueId || !jobTypeId || !contractTemplateId || !eventDate}
            >
              {busy ? 'Creazione...' : 'Crea incarico'}
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded border border-red-200/40 bg-red-400/10 p-3 text-sm text-red-200">{err}</div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Incarico</label>
            <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Categoria prestazione</label>
            <select
              className="input mt-1"
              value={jobTypeId ?? ''}
              onChange={(e) => setJobTypeId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="" disabled>
                Seleziona categoria
              </option>
              {groupedJobTypes.core.length > 0 ? (
                <optgroup label="Core autonomi">
                  {groupedJobTypes.core.map((jt) => (
                    <option key={jt.id} value={jt.id}>
                      {jt.name || `Categoria ${jt.id}`}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {groupedJobTypes.eventOnly.length > 0 ? (
                <optgroup label="Solo evento/picco">
                  {groupedJobTypes.eventOnly.map((jt) => (
                    <option key={jt.id} value={jt.id}>
                      {jt.name || `Categoria ${jt.id}`}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
            {selectedEventOnly ? (
              <div className="mt-2 rounded border border-amber-300/40 bg-amber-400/10 p-2 text-xs text-amber-100">
                Solo evento/picco: incarico legato a evento, non turnazione continuativa.
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium">Data evento</label>
            <input className="input mt-1" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Compenso a risultato (EUR)</label>
            <input className="input mt-1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Template contratto</label>
            <select
              className="input mt-1"
              value={contractTemplateId ?? ''}
              onChange={(e) => setContractTemplateId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="" disabled>
                Seleziona template
              </option>
              {contractTemplates.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name || `Template ${ct.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Assicurazione (opzionale)</label>
            <select
              className="input mt-1"
              value={insuranceProductId ?? ''}
              onChange={(e) => setInsuranceProductId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Nessuna</option>
              {insuranceProducts.map((ip) => (
                <option key={ip.id} value={ip.id}>
                  {ip.name || `Prodotto ${ip.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
