'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'

type VenueDraft = {
  legalName: string
  vatNumber: string
  taxCode: string
  ateco: string
  addressLine: string
  city: string
  province: string
  zipCode: string
  country: string
  repFirstName: string
  repLastName: string
  repTaxCode: string
  repBirthDate: string
  repEmail: string
  repPhone: string
  consents: {
    privacy: boolean
    tos: boolean
    venueDeclaration: boolean
  }
}

const STORAGE_KEY = 'venueOnboardingDraft'

function loadDraft(): VenueDraft | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as VenueDraft
  } catch {
    return null
  }
}

export default function VenueReviewPage() {
  const router = useRouter()
  const { user, loading, apiBase } = useAuth()

  const [draft, setDraft] = useState<VenueDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadDraft()
    setDraft(saved)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/venue/auth/login')
  }, [loading, user, router])

  async function submit() {
    if (!draft) return
    setBusy(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const payload = {
        legalName: draft.legalName,
        vatNumber: draft.vatNumber,
        taxCode: draft.taxCode,
        ateco: draft.ateco,
        legalAddress: {
          line: draft.addressLine,
          city: draft.city,
          province: draft.province,
          zipCode: draft.zipCode,
          country: draft.country,
        },
        legalRepresentative: {
          firstName: draft.repFirstName,
          lastName: draft.repLastName,
          taxCode: draft.repTaxCode,
          birthDate: draft.repBirthDate,
          email: draft.repEmail,
          phone: draft.repPhone,
        },
        consents: {
          privacy: { accepted: true, version: 'v1', acceptedAt: now },
          tos: { accepted: true, version: 'v1', acceptedAt: now },
          venueDeclaration: { accepted: true, version: 'v1', acceptedAt: now },
        },
      }

      const res = await fetch(`${apiBase}/venue/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      router.replace('/venue/dashboard')
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
          <div className="badge">Venue review</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Riepilogo onboarding</h1>
          <p className="mt-1 text-sm text-soft">Controlla i dati prima di inviare.</p>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div> : null}

        {!draft ? (
          <div className="text-sm text-soft">Nessun dato disponibile. Torna indietro.</div>
        ) : (
          <div className="grid gap-3 text-sm text-soft">
            <div>Ragione sociale: {draft.legalName}</div>
            <div>P.IVA: {draft.vatNumber}</div>
            <div>Codice fiscale: {draft.taxCode || '-'}</div>
            <div>ATECO: {draft.ateco}</div>
            <div>Indirizzo: {draft.addressLine}</div>
            <div>
              Citta: {draft.city} ({draft.province}) {draft.zipCode}
            </div>
            <div>Paese: {draft.country}</div>
            <div>Rappresentante: {draft.repFirstName} {draft.repLastName}</div>
            <div>CF rappresentante: {draft.repTaxCode}</div>
            <div>Data nascita: {draft.repBirthDate}</div>
            <div>Email: {draft.repEmail}</div>
            <div>Telefono: {draft.repPhone}</div>
          </div>
        )}

        <div className="flex justify-between">
          <button className="btn-secondary" type="button" onClick={() => router.back()}>
            Indietro
          </button>
          <button className="btn" type="button" onClick={submit} disabled={busy || !draft}>
            {busy ? 'Invio...' : 'Invia onboarding'}
          </button>
        </div>
      </div>
    </div>
  )
}
