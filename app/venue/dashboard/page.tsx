'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import ForbiddenScreen from '@/components/ForbiddenScreen'
import { useAuth } from '@/lib/auth'

type VenueGig = {
  id: number
  title: string
  status: 'draft' | 'published' | 'accepted' | 'completed' | 'settled'
  payAmount: number
  currency: string
  startTime?: string
  endTime?: string
  applicationsCount?: number
  createdAt?: string
  updatedAt?: string
}

type VenueApplication = {
  id: number
  gigId: number
  workerName: string
  status: 'pending' | 'accepted' | 'completed' | 'rejected'
  appliedAt: string
}

type VenueHistory = {
  gigId: number
  title: string
  policySnapshotId: string
  engagementId: string
  compensation: number
  currency: string
  preauthorizedAt: string
  paymentConfirmedAt: string
}

function dateOnly(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString()
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isoRangeForEventDate(dateStr: string) {
  const startLocal = new Date(`${dateStr}T00:00:00`)
  const endLocal = new Date(`${dateStr}T23:59:00`)
  return { startTime: startLocal.toISOString(), endTime: endLocal.toISOString() }
}

export default function VenueDashboardPage() {
  const router = useRouter()
  const { user, loading, error, fetchAuth, signOut } = useAuth()
  const auditHeaders = useMemo(
    () => (user ? { 'x-actor-id': String(user.id), 'x-actor-role': user.role } : {}),
    [user],
  )

  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'history'>('create')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const [title, setTitle] = useState('Incarico autonomo')
  const [eventDate, setEventDate] = useState('')
  const [payAmount, setPayAmount] = useState('60')
  const [currency, setCurrency] = useState('EUR')

  const [gigs, setGigs] = useState<VenueGig[]>([])
  const [editGigId, setEditGigId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPayAmount, setEditPayAmount] = useState('60')
  const [editCurrency, setEditCurrency] = useState('EUR')

  const [selectedGigId, setSelectedGigId] = useState<number | null>(null)
  const [applications, setApplications] = useState<VenueApplication[]>([])

  const [history, setHistory] = useState<VenueHistory[]>([])

  const canUse = useMemo(() => !!user, [user])

  useEffect(() => {
    if (loading) return
    if (!user && error !== 'role_mismatch') router.replace('/venue/auth/login')
  }, [loading, user, error, router])

  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    setEventDate(toDateInputValue(d))
  }, [])

  function handleAuth(res: Response) {
    if (res.status === 401) {
      signOut()
      router.replace('/venue/auth/login')
      return false
    }
    if (res.status === 403) {
      setForbidden(true)
      return false
    }
    return true
  }

  async function loadGigs() {
    if (!canUse) return
    setErr(null)
    const res = (await fetchAuth('/venue/gigs', { headers: auditHeaders })) as Response
    if (!handleAuth(res)) return
    if (!res.ok) {
      setErr(await res.text())
      return
    }
    const data = (await res.json()) as VenueGig[]
    setGigs(Array.isArray(data) ? data : [])
  }

  async function loadHistory() {
    if (!canUse) return
    setErr(null)
    const res = (await fetchAuth('/venue/history', { headers: auditHeaders })) as Response
    if (!handleAuth(res)) return
    if (!res.ok) {
      setErr(await res.text())
      return
    }
    const data = (await res.json()) as VenueHistory[]
    setHistory(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    if (!canUse) return
    loadGigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function createGig() {
    if (!eventDate) return setErr('Seleziona una data evento')
    const amt = Number(payAmount)
    if (!Number.isFinite(amt) || amt <= 0) return setErr('Compenso non valido')
    const { startTime, endTime } = isoRangeForEventDate(eventDate)

    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth('/venue/gigs', {
        method: 'POST',
        headers: { ...auditHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          payAmount: amt,
          currency,
          startTime,
          endTime,
        }),
      })) as Response
      if (!handleAuth(res)) return
      if (!res.ok) throw new Error(await res.text())
      setTitle('Incarico autonomo')
      setPayAmount('60')
      setCurrency('EUR')
      await loadGigs()
      setActiveTab('manage')
      setToast('Gig creato.')
    } catch (e: any) {
      setErr(e?.message || 'Creazione fallita')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(gig: VenueGig) {
    setEditGigId(gig.id)
    setEditTitle(gig.title)
    setEditPayAmount(String(gig.payAmount))
    setEditCurrency(gig.currency)
  }

  async function saveEdit(id: number) {
    const amt = Number(editPayAmount)
    if (!Number.isFinite(amt) || amt <= 0) return setErr('Compenso non valido')
    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth(`/venue/gigs/${id}`, {
        method: 'PATCH',
        headers: { ...auditHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          payAmount: amt,
          currency: editCurrency,
        }),
      })) as Response
      if (!handleAuth(res)) return
      if (!res.ok) throw new Error(await res.text())
      setEditGigId(null)
      await loadGigs()
      setToast('Gig aggiornato.')
    } catch (e: any) {
      setErr(e?.message || 'Salvataggio fallito')
    } finally {
      setBusy(false)
    }
  }

  async function removeGig(id: number) {
    if (!confirm('Eliminare questo incarico?')) return
    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth(`/venue/gigs/${id}`, { method: 'DELETE', headers: auditHeaders })) as Response
      if (!handleAuth(res)) return
      if (!res.ok) throw new Error(await res.text())
      await loadGigs()
      if (selectedGigId === id) {
        setSelectedGigId(null)
        setApplications([])
      }
      setToast('Gig eliminato.')
    } catch (e: any) {
      setErr(e?.message || 'Eliminazione fallita')
    } finally {
      setBusy(false)
    }
  }

  async function viewApplications(gigId: number) {
    setSelectedGigId(gigId)
    setErr(null)
    const res = (await fetchAuth(`/venue/gigs/${gigId}/applications`, { headers: auditHeaders })) as Response
    if (!handleAuth(res)) return
    if (!res.ok) {
      setErr(await res.text())
      return
    }
    const data = (await res.json()) as VenueApplication[]
    setApplications(Array.isArray(data) ? data : [])
  }

  async function acceptApplication(id: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth(`/venue/applications/${id}/accept`, { method: 'POST', headers: auditHeaders })) as Response
      if (!handleAuth(res)) return
      if (!res.ok) throw new Error(await res.text())
      if (selectedGigId) await viewApplications(selectedGigId)
      await loadGigs()
      setToast('Candidatura accettata.')
    } catch (e: any) {
      setErr(e?.message || 'Accettazione fallita')
    } finally {
      setBusy(false)
    }
  }

  async function publishGig(id: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth(`/venue/gigs/${id}/publish`, { method: 'POST', headers: auditHeaders })) as Response
      if (!handleAuth(res)) return
      if (!res.ok) throw new Error(await res.text())
      await loadGigs()
      setToast('Gig pubblicato.')
    } catch (e: any) {
      setErr(e?.message || 'Pubblicazione fallita')
    } finally {
      setBusy(false)
    }
  }

  async function settleGig(id: number) {
    setBusy(true)
    setErr(null)
    try {
      const res = (await fetchAuth(`/gigs/${id}/settle`, { method: 'POST', headers: auditHeaders })) as Response
      if (!handleAuth(res)) return
      if (!res.ok) throw new Error(await res.text())
      await loadGigs()
      await loadHistory()
      setToast('Gig regolato.')
    } catch (e: any) {
      setErr(e?.message || 'Regolazione fallita')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (error === 'role_mismatch' || forbidden) return <ForbiddenScreen />
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  return (
    <div className="mx-auto max-w-6xl px-4">
      <TopBar />

      <div className="card space-y-6">
        <div>
          <div className="badge">Venue</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Dashboard</h1>
          <p className="mt-2 text-sm text-soft">Crea e gestisci incarichi, candidature e storico.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={() => setActiveTab('create')}>
            Crea incarico
          </button>
          <button className="btn-secondary" type="button" onClick={() => setActiveTab('manage')}>
            Gestisci incarichi
          </button>
          <button className="btn-secondary" type="button" onClick={() => setActiveTab('history')}>
            Storico
          </button>
        </div>

        {toast ? <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">{toast}</div> : null}
        {err ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div> : null}

        {activeTab === 'create' ? (
          <div className="space-y-4">
            <div className="text-sm font-medium text-main">Nuovo incarico (quick form)</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Titolo</label>
                <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Data evento</label>
                <input className="input mt-1" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Compenso</label>
                <input className="input mt-1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Valuta</label>
                <input className="input mt-1" value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="btn" type="button" onClick={createGig} disabled={busy}>
                {busy ? 'Creazione...' : 'Crea incarico'}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'manage' ? (
          <div className="space-y-4">
            <div className="text-sm font-medium text-main">Gestisci incarichi</div>
            {gigs.length === 0 ? <div className="text-sm text-soft">Nessun incarico.</div> : null}
            {gigs.map((gig) => (
              <div key={gig.id} className="rounded border border-light bg-surface p-3">
                {editGigId === gig.id ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium">Titolo</label>
                      <input className="input mt-1" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Compenso</label>
                      <input className="input mt-1" value={editPayAmount} onChange={(e) => setEditPayAmount(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Valuta</label>
                      <input className="input mt-1" value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn" type="button" onClick={() => saveEdit(gig.id)} disabled={busy}>
                        Salva
                      </button>
                      <button className="btn-secondary" type="button" onClick={() => setEditGigId(null)} disabled={busy}>
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-main">{gig.title}</div>
                      <div className="text-xs text-soft">
                        Stato: {gig.status} - Compenso: {gig.payAmount} {gig.currency}
                      </div>
                      <div className="text-xs text-soft">
                        Data: {dateOnly(gig.startTime)} - Candidature: {gig.applicationsCount ?? 0}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gig.status === 'draft' ? (
                        <button className="btn-secondary" type="button" onClick={() => publishGig(gig.id)} disabled={busy}>
                          Pubblica
                        </button>
                      ) : null}
                      {gig.status === 'completed' ? (
                        <button className="btn-secondary" type="button" onClick={() => settleGig(gig.id)} disabled={busy}>
                          Regola
                        </button>
                      ) : null}
                      <button className="btn-secondary" type="button" onClick={() => startEdit(gig)} disabled={busy}>
                        Modifica
                      </button>
                      <button className="btn-secondary" type="button" onClick={() => viewApplications(gig.id)} disabled={busy}>
                        Vedi candidature
                      </button>
                      <button className="btn-secondary" type="button" onClick={() => removeGig(gig.id)} disabled={busy}>
                        Elimina
                      </button>
                    </div>
                  </div>
                )}

                {selectedGigId === gig.id ? (
                  <div className="mt-3 border-t border-light pt-3">
                    <div className="text-xs font-medium">Candidature</div>
                    {applications.length === 0 ? (
                      <div className="text-xs text-soft">Nessuna candidatura.</div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {applications.map((app) => (
                          <div key={app.id} className="flex items-center justify-between rounded border border-light p-2">
                            <div className="text-xs">
                              <div className="font-medium text-main">{app.workerName}</div>
                              <div className="text-soft">Stato: {app.status}</div>
                            </div>
                            <button
                              className="btn"
                              type="button"
                              onClick={() => acceptApplication(app.id)}
                              disabled={busy || app.status !== 'pending'}
                            >
                              Accetta
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === 'history' ? (
          <div className="space-y-4">
            <div className="text-sm font-medium text-main">Storico incarichi</div>
            {history.length === 0 ? <div className="text-sm text-soft">Nessun incarico completato.</div> : null}
            {history.map((item) => (
              <div key={item.gigId} className="rounded border border-light bg-surface p-3 text-xs text-soft">
                <div className="text-sm font-medium text-main">{item.title}</div>
                <div>Policy snapshot: {item.policySnapshotId}</div>
                <div>Engagement: {item.engagementId}</div>
                <div>
                  Compenso: {item.compensation} {item.currency}
                </div>
                <div>Preautorizzazione: {dateOnly(item.preauthorizedAt)}</div>
                <div>Pagamento confermato: {dateOnly(item.paymentConfirmedAt)}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
