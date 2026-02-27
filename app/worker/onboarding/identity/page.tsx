'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import UploadDropzone from '@/components/UploadDropzone'
import { useAuth } from '@/lib/auth'

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

function saveDraft(draft: WorkerDraft) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export default function WorkerIdentityPage() {
  const router = useRouter()
  const { user, loading, apiBase } = useAuth()

  const [draft, setDraft] = useState<WorkerDraft>({
    documentFrontId: '',
    documentBackId: '',
    profilePhotoId: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    profilePhotoUrl: '',
    addressLine: '',
    city: '',
    province: '',
    zipCode: '',
    country: 'Italia',
    taxCode: '',
    consents: { privacy: false, tos: false, workerDeclaration: false },
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadDraft()
    if (saved) setDraft(saved)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/worker/auth/login')
  }, [loading, user, router])

  function update(next: Partial<WorkerDraft>) {
    const merged = { ...draft, ...next }
    setDraft(merged)
    saveDraft(merged)
  }

  function updateConsent(key: keyof WorkerDraft['consents']) {
    const next = { ...draft.consents, [key]: !draft.consents[key] }
    update({ consents: next })
  }

  const missingUploads = {
    documentFront: !draft.documentFrontId || !draft.documentFrontUrl,
    documentBack: !draft.documentBackId || !draft.documentBackUrl,
    profilePhoto: !draft.profilePhotoId || !draft.profilePhotoUrl,
  }

  const missingResidence = {
    addressLine: !draft.addressLine.trim(),
    city: !draft.city.trim(),
    province: !draft.province.trim(),
    zipCode: !draft.zipCode.trim(),
    country: !draft.country.trim(),
  }

  const missingTaxCode = draft.taxCode.trim().length < 8
  const missingConsents =
    !draft.consents.privacy || !draft.consents.tos || !draft.consents.workerDeclaration

  const missingItems = [
    missingUploads.documentFront ? 'Documento fronte' : null,
    missingUploads.documentBack ? 'Documento retro' : null,
    missingUploads.profilePhoto ? 'Foto profilo' : null,
    missingResidence.addressLine ? 'Indirizzo' : null,
    missingResidence.city ? 'Citta' : null,
    missingResidence.province ? 'Provincia' : null,
    missingResidence.zipCode ? 'CAP' : null,
    missingResidence.country ? 'Paese' : null,
    missingTaxCode ? 'Codice fiscale' : null,
    missingConsents ? 'Consensi' : null,
  ].filter(Boolean)

  const formValid = missingItems.length === 0

  function goNext() {
    setError(null)
    if (!formValid) {
      return setError('Completa i campi richiesti evidenziati.')
    }
    router.push('/worker/onboarding/review')
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />

      <div className="card space-y-6">
        <div>
          <div className="badge">Worker onboarding</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Identita e documenti</h1>
          <p className="mt-1 text-sm text-soft">Carica documenti e completa i dati anagrafici.</p>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <UploadDropzone
              label="Documento fronte"
              apiBase={apiBase}
              accept=".jpg,.jpeg,.png"
              maxSizeMb={8}
              uploaded={
                draft.documentFrontId && draft.documentFrontUrl
                  ? { fileId: draft.documentFrontId, url: draft.documentFrontUrl }
                  : null
              }
              onUploaded={(result) => update({ documentFrontId: result.fileId, documentFrontUrl: result.url })}
            />
            {missingUploads.documentFront ? (
              <div className="text-xs text-red-600">Carica documento fronte.</div>
            ) : null}
          </div>
          <div className="space-y-2">
            <UploadDropzone
              label="Documento retro"
              apiBase={apiBase}
              accept=".jpg,.jpeg,.png"
              maxSizeMb={8}
              uploaded={
                draft.documentBackId && draft.documentBackUrl
                  ? { fileId: draft.documentBackId, url: draft.documentBackUrl }
                  : null
              }
              onUploaded={(result) => update({ documentBackId: result.fileId, documentBackUrl: result.url })}
            />
            {missingUploads.documentBack ? (
              <div className="text-xs text-red-600">Carica documento retro.</div>
            ) : null}
          </div>
          <div className="space-y-2">
            <UploadDropzone
              label="Foto profilo"
              apiBase={apiBase}
              accept=".jpg,.jpeg,.png"
              maxSizeMb={5}
              uploaded={
                draft.profilePhotoId && draft.profilePhotoUrl
                  ? { fileId: draft.profilePhotoId, url: draft.profilePhotoUrl }
                  : null
              }
              onUploaded={(result) => update({ profilePhotoId: result.fileId, profilePhotoUrl: result.url })}
            />
            {missingUploads.profilePhoto ? (
              <div className="text-xs text-red-600">Carica foto profilo.</div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Indirizzo</label>
            <input
              className="input mt-1"
              value={draft.addressLine}
              onChange={(e) => update({ addressLine: e.target.value })}
            />
            {missingResidence.addressLine ? (
              <div className="mt-1 text-xs text-red-600">Indirizzo obbligatorio.</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium">Citta</label>
            <input className="input mt-1" value={draft.city} onChange={(e) => update({ city: e.target.value })} />
            {missingResidence.city ? <div className="mt-1 text-xs text-red-600">Citta obbligatoria.</div> : null}
          </div>
          <div>
            <label className="text-sm font-medium">Provincia</label>
            <input
              className="input mt-1"
              value={draft.province}
              onChange={(e) => update({ province: e.target.value })}
            />
            {missingResidence.province ? (
              <div className="mt-1 text-xs text-red-600">Provincia obbligatoria.</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium">CAP</label>
            <input
              className="input mt-1"
              value={draft.zipCode}
              onChange={(e) => update({ zipCode: e.target.value })}
            />
            {missingResidence.zipCode ? <div className="mt-1 text-xs text-red-600">CAP obbligatorio.</div> : null}
          </div>
          <div>
            <label className="text-sm font-medium">Paese</label>
            <input
              className="input mt-1"
              value={draft.country}
              onChange={(e) => update({ country: e.target.value })}
            />
            {missingResidence.country ? <div className="mt-1 text-xs text-red-600">Paese obbligatorio.</div> : null}
          </div>
          <div>
            <label className="text-sm font-medium">Codice fiscale</label>
            <input
              className="input mt-1"
              value={draft.taxCode}
              onChange={(e) => update({ taxCode: e.target.value.toUpperCase() })}
            />
            {missingTaxCode ? (
              <div className="mt-1 text-xs text-red-600">Codice fiscale non valido.</div>
            ) : null}
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
              checked={draft.consents.workerDeclaration}
              onChange={() => updateConsent('workerDeclaration')}
            />
            Dichiarazione worker (v1)
          </label>
          {missingConsents ? (
            <div className="text-xs text-red-600">Accetta tutti i consensi richiesti.</div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <button className="btn-secondary" type="button" onClick={() => router.back()}>
              Indietro
            </button>
            <button className="btn-secondary" type="button" onClick={() => router.push('/')}>
              Home
            </button>
          </div>
          <button className="btn" type="button" onClick={goNext} disabled={!formValid}>
            Vai alla review
          </button>
        </div>
      </div>
    </div>
  )
}
