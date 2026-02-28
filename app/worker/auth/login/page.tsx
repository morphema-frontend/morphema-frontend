'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MorphemaLogo from '@/components/MorphemaLogo'
import { useAuth } from '@/lib/auth'
import type { ApiResponse } from '@/lib/api'

export default function WorkerLoginPage() {
  const router = useRouter()
  const { user, loading, signIn, error: authError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) return
    router.replace('/worker/dashboard')
  }, [loading, user, router])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)
    if (!email.includes('@')) return setError('Email non valida')
    if (password.length < 8) return setError('Password troppo corta (min 8 caratteri)')

    setBusy(true)
    try {
      const result = (await signIn(email, password)) as ApiResponse<any>
      if (!result.ok) {
        if (result.status === 400) setError('Compila email e password')
        else if (result.status === 401) setError('Credenziali non valide')
        else if (result.status >= 500) setError('Errore server, riprova')
        else setError(result.error?.message || 'Login fallito')
        return
      }
      router.replace('/worker/dashboard')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  return (
    <div className="mx-auto mt-12 max-w-md px-4">
      <div className="card space-y-4 text-center">
        <MorphemaLogo />
        <div>
          <div className="badge">Worker login</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Accedi al profilo worker</h1>
          <p className="mt-2 text-sm text-soft">Inserisci le credenziali per continuare.</p>
        </div>

        {authError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{authError}</div>
        ) : null}
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div>
        ) : null}

        <form className="space-y-3 text-left" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              className="input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn w-full" type="submit" disabled={busy}>
            {busy ? 'Accesso...' : 'Entra'}
          </button>
        </form>
      </div>
    </div>
  )
}
