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

function saveDraft(draft: VenueDraft) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export default function VenueCompanyPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [draft, setDraft] = useState<VenueDraft>({
    legalName: '',
    vatNumber: '',
    taxCode: '',
    ateco: '',
    addressLine: '',
    city: '',
    province: '',
    zipCode: '',
    country: 'Italia',
    repFirstName: '',
    repLastName: '',
    repTaxCode: '',
    repBirthDate: '',
    repEmail: '',
    repPhone: '',
    consents: { privacy: false, tos: false, venueDeclaration: false },
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadDraft()
    if (saved) setDraft(saved)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/venue/auth/login')
  }, [loading, user, router])

  function update(next: Partial<VenueDraft>) {
    const merged = { ...draft, ...next }
    setDraft(merged)
    saveDraft(merged)
  }

  function updateConsent(key: keyof VenueDraft['consents']) {
    const next = { ...draft.consents, [key]: !draft.consents[key] }
    update({ consents: next })
  }

  function goNext() {
    setError(null)
    if (!draft.legalName || !draft.vatNumber || !draft.ateco) {
      return setError('Compila ragione sociale, P.IVA e ATECO.')
    }
    if (!draft.addressLine || !draft.city || !draft.province || !draft.zipCode || !draft.country) {
      return setError('Compila la sede legale completa.')
    }
    if (!draft.repFirstName || !draft.repLastName || !draft.repTaxCode || !draft.repBirthDate) {
      return setError('Compila i dati del rappresentante legale.')
    }
    if (!draft.repEmail.includes('@') || draft.repPhone.length < 6) {
      return setError('Inserisci email e telefono validi.')
    }
    if (!draft.consents.privacy || !draft.consents.tos || !draft.consents.venueDeclaration) {
      return setError('Accetta tutti i consensi richiesti.')
    }
    router.push('/venue/onboarding/review')
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      <div className="card space-y-6">
        <div>
          <div className="badge">Venue onboarding</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Dati societari</h1>
          <p className="mt-1 text-sm text-soft">Inserisci i dati fiscali e legali della struttura.</p>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Ragione sociale</label>
            <input className="input mt-1" value={draft.legalName} onChange={(e) => update({ legalName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">P.IVA</label>
            <input className="input mt-1" value={draft.vatNumber} onChange={(e) => update({ vatNumber: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Codice fiscale (se richiesto)</label>
            <input className="input mt-1" value={draft.taxCode} onChange={(e) => update({ taxCode: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">ATECO</label>
            <input className="input mt-1" value={draft.ateco} onChange={(e) => update({ ateco: e.target.value })} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Indirizzo sede legale</label>
            <input className="input mt-1" value={draft.addressLine} onChange={(e) => update({ addressLine: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Citta</label>
            <input className="input mt-1" value={draft.city} onChange={(e) => update({ city: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Provincia</label>
            <input className="input mt-1" value={draft.province} onChange={(e) => update({ province: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">CAP</label>
            <input className="input mt-1" value={draft.zipCode} onChange={(e) => update({ zipCode: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Paese</label>
            <input className="input mt-1" value={draft.country} onChange={(e) => update({ country: e.target.value })} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Nome rappresentante legale</label>
            <input className="input mt-1" value={draft.repFirstName} onChange={(e) => update({ repFirstName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Cognome rappresentante legale</label>
            <input className="input mt-1" value={draft.repLastName} onChange={(e) => update({ repLastName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Codice fiscale rappresentante</label>
            <input className="input mt-1" value={draft.repTaxCode} onChange={(e) => update({ repTaxCode: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="text-sm font-medium">Data di nascita</label>
            <input className="input mt-1" type="date" value={draft.repBirthDate} onChange={(e) => update({ repBirthDate: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Email rappresentante</label>
            <input className="input mt-1" value={draft.repEmail} onChange={(e) => update({ repEmail: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Telefono rappresentante</label>
            <input className="input mt-1" value={draft.repPhone} onChange={(e) => update({ repPhone: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-main">Consensi</div>
          <label className="flex items-center gap-2 text-sm text-soft">
            <input type="checkbox" checked={draft.consents.privacy} onChange={() => updateConsent('privacy')} />
            Accetto informativa privacy (v1)
          </label>
          <label className="flex items-center gap-2 text-sm text-soft">
            <input type="checkbox" checked={draft.consents.tos} onChange={() => updateConsent('tos')} />
            Accetto termini di servizio (v1)
          </label>
          <label className="flex items-center gap-2 text-sm text-soft">
            <input
              type="checkbox"
              checked={draft.consents.venueDeclaration}
              onChange={() => updateConsent('venueDeclaration')}
            />
            Dichiarazione venue (v1)
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn" type="button" onClick={goNext}>
            Vai alla review
          </button>
        </div>
      </div>
    </div>
  )
}
