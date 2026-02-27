'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'
import { logAuditClient } from '@/lib/auditClient'

type WorkerDraft = {
  documentFrontId?: string
  documentBackId?: string
  profilePhotoId?: string
  documentFrontUrl?: string
  documentBackUrl?: string
  profilePhotoUrl?: string
  addressLine: string
  city: string
  province: string
  zipCode: string
  country: string
  taxCode: string
  consents: {
    privacy: boolean
    tos: boolean
    workerDeclaration: boolean
  }
}

const STORAGE_KEY = 'workerOnboardingDraft'

function loadDraft(): WorkerDraft | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WorkerDraft
  } catch {
    return null
  }
}

export default function WorkerReviewPage() {
  const router = useRouter()
  const { user, loading, apiBase } = useAuth()

  const [draft, setDraft] = useState<WorkerDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const missingItems = !draft
    ? []
    : [
        !draft.documentFrontId || !draft.documentFrontUrl ? 'Documento fronte' : null,
        !draft.documentBackId || !draft.documentBackUrl ? 'Documento retro' : null,
        !draft.profilePhotoId || !draft.profilePhotoUrl ? 'Foto profilo' : null,
        !draft.addressLine?.trim() ? 'Indirizzo' : null,
        !draft.city?.trim() ? 'Citta' : null,
        !draft.province?.trim() ? 'Provincia' : null,
        !draft.zipCode?.trim() ? 'CAP' : null,
        !draft.country?.trim() ? 'Paese' : null,
        !draft.taxCode || draft.taxCode.trim().length < 8 ? 'Codice fiscale' : null,
        !draft.consents?.privacy || !draft.consents?.tos || !draft.consents?.workerDeclaration ? 'Consensi' : null,
      ].filter(Boolean)

  useEffect(() => {
    const saved = loadDraft()
    setDraft(saved)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/worker/auth/login')
  }, [loading, user, router])

  async function submit() {
    if (!draft) return
    if (missingItems.length > 0) {
      setError('Dati mancanti: ' + missingItems.join(', '))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const payload = {
        documentFrontId: draft.documentFrontId,
        documentBackId: draft.documentBackId,
        profilePhotoId: draft.profilePhotoId,
        address: {
          line: draft.addressLine,
          city: draft.city,
          province: draft.province,
          zipCode: draft.zipCode,
          country: draft.country,
        },
        taxCode: draft.taxCode,
        consents: {
          privacy: { accepted: true, version: 'v1', acceptedAt: now },
          tos: { accepted: true, version: 'v1', acceptedAt: now },
          workerDeclaration: { accepted: true, version: 'v1', acceptedAt: now },
        },
      }

      const res = await fetch(`${apiBase}/worker/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      await logAuditClient(
        { action: 'onboarding_submit', entityType: 'worker', entityId: String(user?.id || '') },
        user
      )
      router.replace('/worker/dashboard')
    } catch (e: any) {
      setError(e?.message || 'Invio onboarding fallito')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>

  return (
    <div className="mx-auto max-w-4xl px-4">
      <TopBar />
      <div className="card space-y-4">
        <div>
          <div className="badge">Worker review</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Riepilogo onboarding</h1>
          <p className="mt-1 text-sm text-soft">Controlla i dati prima di inviare.</p>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div> : null}

        {!draft ? (
          <div className="text-sm text-soft">Nessun dato disponibile. Torna indietro.</div>
        ) : (
          <>
            {missingItems.length > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Mancano: {missingItems.join(', ')}
              </div>
            ) : null}
            <div className="grid gap-3 text-sm text-soft">
              <div>Documento fronte: {draft.documentFrontId || '-'}</div>
              <div>Documento fronte URL: {draft.documentFrontUrl || '-'}</div>
              <div>Documento retro: {draft.documentBackId || '-'}</div>
              <div>Documento retro URL: {draft.documentBackUrl || '-'}</div>
              <div>Foto profilo: {draft.profilePhotoId || '-'}</div>
              <div>Foto profilo URL: {draft.profilePhotoUrl || '-'}</div>
              <div>Indirizzo: {draft.addressLine}</div>
              <div>
                Citta: {draft.city} ({draft.province}) {draft.zipCode}
              </div>
              <div>Paese: {draft.country}</div>
              <div>Codice fiscale: {draft.taxCode}</div>
              <div>Consensi: {draft.consents.privacy && draft.consents.tos && draft.consents.workerDeclaration ? 'Ok' : 'Non completo'}</div>
            </div>
          </>
        )}

        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <button className="btn-secondary" type="button" onClick={() => router.back()}>
              Indietro
            </button>
            <button className="btn-secondary" type="button" onClick={() => router.push('/')}>
              Home
            </button>
          </div>
          <button className="btn" type="button" onClick={submit} disabled={busy || !draft || missingItems.length > 0}>
            {busy ? 'Invio...' : 'Invia onboarding'}
          </button>
        </div>
      </div>
    </div>
  )
}
