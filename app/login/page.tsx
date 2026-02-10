'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function redirectForRole(role?: string) {
  if (role === 'worker') return '/worker/gigs'
  if (role === 'horeca' || role === 'admin') return '/venue/gigs'
  return '/'
}

type Preset = { label: string; email: string; password: string; hint: string }

const PRESETS: Preset[] = [
  {
    label: 'Committente (venue@test.com)',
    email: 'venue@test.com',
    password: 'password123',
    hint: 'Crea e pubblica un incarico, poi accetta la Candidatura.',
  },
  {
    label: 'Professionista occasionale (worker@test.com)',
    email: 'worker@test.com',
    password: 'password123',
    hint: 'Vedi un incarico pubblicato e invia la Candidatura.',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, error, signIn } = useAuth()

  const [email, setEmail] = useState(PRESETS[1].email)
  const [password, setPassword] = useState(PRESETS[1].password)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) return
    router.replace(redirectForRole(user.role))
  }, [loading, user, router])

  async function doLogin(e?: React.FormEvent) {
    e?.preventDefault()
    setLocalError(null)
    setBusy(true)
    try {
      await signIn(email, password)
      router.replace('/')
    } catch (e: any) {
      setLocalError(e?.message || 'Accesso fallito')
    } finally {
      setBusy(false)
    }
  }

  function fill(p: Preset) {
    setEmail(p.email)
    setPassword(p.password)
  }

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <div className="card space-y-4">
        <div>
          <div className="badge">Demo</div>
          <h1 className="mt-2 text-xl font-semibold">Accesso</h1>
          <p className="text-sm text-zinc-700">
            Demo di <b>Incarico autonomo</b> (art. 2222 c.c.).
          </p>
        </div>

        {(localError || error) ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {localError || error}
          </div>
        ) : null}

        <div className="space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn-secondary w-full justify-start"
              onClick={() => fill(p)}
              disabled={busy}
              title={p.hint}
            >
              {p.label}
            </button>
          ))}
          <div className="text-xs text-zinc-500">Nota: i preset usano account presenti nel DB demo.</div>
        </div>

        <form onSubmit={doLogin} className="space-y-3">
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
