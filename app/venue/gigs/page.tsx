'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import GatedScreen from '@/components/GatedScreen'
import ForbiddenScreen from '@/components/ForbiddenScreen'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'
import { isVenueRole } from '@/lib/roles'
import { readReasonCode } from '@/lib/gating'

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

type ContractTemplate = { id: number; name: string; [k: string]: any }
type InsuranceProduct = { id: number; name: string; [k: string]: any }

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

export default function VenueGigsPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut, apiBase, error } = useAuth()

  const [gigs, setGigs] = useState<Gig[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [venueId, setVenueId] = useState<number | null>(null)
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([])
  const [insuranceProducts, setInsuranceProducts] = useState<InsuranceProduct[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [gateReason, setGateReason] = useState<string | null>(null)

  const canUse = useMemo(() => !!user && isVenueRole(user.role), [user])

  useEffect(() => {
    if (loading) return
    if (!user && error !== 'role_mismatch') return router.replace('/venue/auth/login')
    if (user?.role === 'worker') return router.replace('/worker/gigs')
  }, [loading, user, error, router])

  async function resolveVenueId() {
    if (venueId) return venueId
    const vRes = (await fetchAuth('/horeca-venues/me')) as Response
    if (vRes.status === 401) {
      signOut()
      router.replace('/venue/auth/login')
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

  async function loadAll() {
    if (!canUse) return
    setBusy(true)
    setErr(null)
    try {
      const venueIdValue = await resolveVenueId()
      if (!venueIdValue) return

      const gRes = await fetchAuth(`/gigs?venueId=${venueIdValue}`)
      if (gRes.status === 401) {
        signOut()
        router.replace('/venue/auth/login')
        return
      }
      if (gRes.status === 403) {
        const reason = await readReasonCode(gRes)
        if (reason) {
          setGateReason(reason)
          return
        }
      }
      if (!gRes.ok) throw new Error(await readError(gRes))
      const gJson = await gRes.json()
      setGigs(Array.isArray(gJson) ? gJson : [])

      const bRes = await fetchAuth('/bookings')
      if (bRes.status === 401) {
        signOut()
        router.replace('/venue/auth/login')
        return
      }
      if (bRes.status === 403) {
        const reason = await readReasonCode(bRes)
        if (reason) {
          setGateReason(reason)
          return
        }
      }
      if (!bRes.ok) throw new Error(await readError(bRes))
      const bJson = await bRes.json()
      setBookings(Array.isArray(bJson) ? bJson : [])

      const ctRes = await fetchAuth('/contract-templates')
      if (ctRes.ok) {
        const ctList = normalizeList<ContractTemplate>(await ctRes.json())
        setContractTemplates(ctList)
      }

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
      }
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
      if (res.status === 403) {
        const reason = await readReasonCode(res)
        if (reason) {
          setGateReason(reason)
          return
        }
      }
      if (!res.ok) throw new Error(await readError(res))
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
      if (res.status === 403) {
        const reason = await readReasonCode(res)
        if (reason) {
          setGateReason(reason)
          return
        }
      }
      if (!res.ok) throw new Error(await readError(res))
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
      if (!res.ok) throw new Error(await readError(res))
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

  const contractLabel = (gig: Gig) => {
    if (gig?.contractSnapshot?.name) return gig.contractSnapshot.name
    const match = contractTemplates.find((ct) => ct.id === gig.contractTemplateId)
    if (match?.name) return match.name
    if (gig.contractTemplateId) return `Template #${gig.contractTemplateId}`
    return '-'
  }

  const insuranceLabel = (gig: Gig) => {
    if (gig?.insuranceSnapshot?.name) return gig.insuranceSnapshot.name
    const match = insuranceProducts.find((ip) => ip.id === gig.insuranceProductId)
    if (match?.name) return match.name
    if (gig.insuranceProductId) return `Prodotto #${gig.insuranceProductId}`
    return 'Nessuna'
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (error === 'role_mismatch') return <ForbiddenScreen />
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>
  if (gateReason) return <GatedScreen reasonCode={gateReason} ctaHref="/venue/onboarding/company" />

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Committente</div>
            <h1 className="mt-2 text-lg font-semibold text-main">Incarico autonomo (demo)</h1>
            <p className="mt-1 text-sm text-soft">
              Prestazione autonoma (art. 2222 c.c.) tra Committente e Professionista. Solo Candidatura.
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
          <div className="mt-4 text-sm text-soft">Nessun incarico presente. Crea un nuovo incarico.</div>
        ) : null}

        {demoGig ? (
          <div className="mt-4 rounded-xl border border-light bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm text-soft">Stato: {demoGig.publishStatus || '-'}</div>
                <div className="text-sm text-soft">Data evento: {dateOnly(demoGig.startTime)}</div>
                <div className="text-sm text-soft">
                  Compenso: {String(demoGig.payAmount ?? '-')} {demoGig.currency || 'EUR'}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="badge">Contratto: {contractLabel(demoGig)}</span>
                  <span className="badge">Assicurazione: {insuranceLabel(demoGig)}</span>
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

            <div className="mt-4 border-t border-light pt-4">
              <div className="text-sm font-medium">Candidature (demo)</div>

              {pendingForDemoGig.length === 0 ? (
                <div className="mt-2 text-sm text-soft">
                  Nessuna candidatura in attesa. Accedi come Professionista occasionale e invia la Candidatura.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {pendingForDemoGig.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg border border-light bg-surface p-3"
                    >
                      <div className="text-sm">
                        <div className="font-medium text-main">Candidatura #{b.id}</div>
                        <div className="text-xs text-soft">Professionista occasionale (userId): {b.workerUserId}</div>
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
