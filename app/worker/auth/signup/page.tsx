'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MorphemaLogo from '@/components/MorphemaLogo'
import { useAuth } from '@/lib/auth'

type SignupPayload = {
  email: string
  password: string
  role: string
}

export default function WorkerSignupPage() {
  const router = useRouter()
  const { user, loading, apiBase, signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) return
    router.replace('/worker/onboarding/identity')
  }, [loading, user, router])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!email.includes('@')) return setError('Email non valida')
    if (password.length < 8) return setError('Password troppo corta (min 8 caratteri)')
    if (password !== confirm) return setError('Le password non coincidono')

    setBusy(true)
    try {
      const payload: SignupPayload = { email, password, role: 'worker' }
      const res = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      await signIn(email, password)
      router.replace('/worker/onboarding/identity')
    } catch (e: any) {
      setError(e?.message || 'Signup fallito')
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
          <div className="badge">Worker signup</div>
          <h1 className="mt-3 text-xl font-semibold text-main">Crea account worker</h1>
          <p className="mt-2 text-sm text-soft">Email e password per iniziare onboarding.</p>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div> : null}

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
          <div>
            <label className="text-sm font-medium">Conferma password</label>
            <input
              className="input mt-1"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn w-full" type="submit" disabled={busy}>
            {busy ? 'Creazione...' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  )
}
