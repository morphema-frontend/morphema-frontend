'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import GatedScreen from '@/components/GatedScreen'
import { useAuth } from '@/lib/auth'
import { readReasonCode } from '@/lib/gating'

type Gig = {
  id: number
  title: string
  status: 'draft' | 'published' | 'accepted' | 'completed' | 'settled'
  payAmount: number
  currency: string
  startTime?: string
  endTime?: string
}

type Application = {
  id: number
  gigId: number
  workerName: string
  status: 'pending' | 'accepted' | 'completed' | 'rejected'
  appliedAt: string
}

function dateOnly(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString()
}

async function readError(res: Response) {
  const text = await res.text()
  return text || `${res.status} ${res.statusText}`
}

export default function WorkerGigsPage() {
  const router = useRouter()
  const { user, loading, fetchAuth, signOut } = useAuth()
  const auditHeaders = useMemo(
    () => (user ? { 'x-actor-id': String(user.id), 'x-actor-role': user.role } : {}),
    [user],
  )

  const [gigs, setGigs] = useState<Gig[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [gateReason, setGateReason] = useState<string | null>(null)

  const canUse = useMemo(() => !!user && user.role === 'worker', [user])

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/worker/auth/login')
    if (user.role !== 'worker') return router.replace('/venue/dashboard')
  }, [loading, user, router])

  async function loadGigs() {
    if (!canUse) return
    setErr(null)
    const res = (await fetchAuth('/gigs', { headers: auditHeaders })) as Response
    if (res.status === 401) {
      signOut()
      router.replace('/worker/auth/login')
      return
    }
    if (res.status === 403) {
      const reason = await readReasonCode(res)
      if (reason) {
        setGateReason(reason)
        return
      }
    }
    if (!res.ok) throw new Error(await readError(res))
    const data = (await res.json()) as Gig[]
    setGigs(Array.isArray(data) ? data : [])
  }

  async function loadApplications() {
    if (!canUse) return
    const res = (await fetchAuth('/worker/applications', { headers: auditHeaders })) as Response
    if (res.status === 401) {
      signOut()
      router.replace('/worker/auth/login')
      return
    }
    if (res.status === 403) {
      const reason = await readReasonCode(res)
      if (reason) {
        setGateReason(reason)
        return
      }
    }
    if (!res.ok) throw new Error(await readError(res))
    const data = (await res.json()) as Application[]
    setApplications(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    if (!canUse) return
    ;(async () => {
      setBusy(true)
      try {
        await loadGigs()
        await loadApplications()
      } catch (e: any) {
        setErr(e?.message || 'Errore nel caricamento')
      } finally {
        setBusy(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  async function apply(gigId: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth(`/gigs/${gigId}/apply`, {
        method: 'POST',
        headers: { ...auditHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerName: user?.name || 'Worker' }),
      })) as Response
      if (res.status === 401) {
        signOut()
        router.replace('/worker/auth/login')
        return
      }
      if (res.ok) {
        await loadApplications()
        setToast('Candidatura inviata.')
        return
      }
      if (res.status === 403) {
        const reason = await readReasonCode(res)
        if (reason) {
          setGateReason(reason)
          return
        }
      }
      throw new Error(await readError(res))
    } catch (e: any) {
      setErr(e?.message || 'Invio candidatura fallito')
    } finally {
      setBusy(false)
    }
  }

  async function markCompleted(applicationId: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth(`/applications/${applicationId}/complete`, { method: 'POST', headers: auditHeaders })) as Response
      if (res.status === 401) {
        signOut()
        router.replace('/worker/auth/login')
        return
      }
      if (!res.ok) throw new Error(await readError(res))
      await loadApplications()
      await loadGigs()
      setToast('Prestazione completata.')
    } catch (e: any) {
      setErr(e?.message || 'Completamento fallito')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>
  if (gateReason) return <GatedScreen reasonCode={gateReason} ctaHref="/worker/onboarding/identity" />

  const applicationMap = applications.reduce<Record<number, Application>>((acc, app) => {
    acc[app.gigId] = app
    return acc
  }, {})

  const acceptedApp = applications.find((app) => app.status === 'accepted')
  const acceptedGig = acceptedApp ? gigs.find((g) => g.id === acceptedApp.gigId) : null

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      {acceptedApp && acceptedGig ? (
        <div className="card card-accent mb-4 border-mid bg-blush">
          <div className="text-lg font-semibold text-main">Sei stato selezionato</div>
          <div className="mt-2 text-sm text-soft">
            {acceptedGig.title} - {dateOnly(acceptedGig.startTime)}
          </div>
          <div className="mt-2 text-sm text-soft">
            Compenso: {acceptedGig.payAmount} {acceptedGig.currency}
          </div>
          <div className="mt-3">
            <button className="btn" type="button" onClick={() => markCompleted(acceptedApp.id)} disabled={busy}>
              Segna come completato
            </button>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge">Worker</div>
            <h1 className="mt-2 text-lg font-semibold text-main">Gigs disponibili</h1>
            <p className="mt-1 text-sm text-soft">Candidati, attendi l&apos;accettazione e completa il gig.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={loadGigs} disabled={busy}>
              Aggiorna gigs
            </button>
            <button className="btn-secondary" onClick={loadApplications} disabled={busy}>
              Aggiorna candidature
            </button>
          </div>
        </div>

        {toast ? <div className="mt-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">{toast}</div> : null}
        {err ? <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div> : null}

        {gigs.length === 0 && !busy ? (
          <div className="mt-4 text-sm text-soft">Nessun gig pubblicato.</div>
        ) : null}

        <div className="mt-4 space-y-3">
          {gigs.map((gig) => {
            const app = applicationMap[gig.id]
            const status = app?.status || ''
            const label =
              status === 'pending'
                ? 'In revisione'
                : status === 'accepted'
                ? 'Accettato'
                : status === 'completed'
                ? 'Completato'
                : status === 'rejected'
                ? 'Rifiutato'
                : ''
            const canApply = !app && gig.status === 'published'
            return (
              <div key={gig.id} className="rounded border border-light bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-main">{gig.title}</div>
                    <div className="text-xs text-soft">
                      Data: {dateOnly(gig.startTime)} - Compenso: {gig.payAmount} {gig.currency}
                    </div>
                    {label ? <span className="badge">{label}</span> : null}
                  </div>
                  <div className="flex gap-2">
                    {canApply ? (
                      <button className="btn" type="button" onClick={() => apply(gig.id)} disabled={busy}>
                        Candidati
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
