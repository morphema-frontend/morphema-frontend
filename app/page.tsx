'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function go(role?: string) {
  if (role === 'worker') return '/worker/gigs'
  if (role === 'horeca' || role === 'admin') return '/venue/gigs'
  return '/login'
}

export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user) router.replace(go(user.role))
  }, [loading, user, router])

  if (loading) return <div className="card">Loading...</div>
  if (user) return <div className="card">Redirecting...</div>

  return (
    <div className="mx-auto mt-16 max-w-3xl px-4">
      <div className="card space-y-3">
        <div className="badge">Demo</div>
        <h1 className="text-2xl font-semibold">Incarico autonomo</h1>
        <p className="text-zinc-700">
          Incarico autonomo (art. 2222 c.c.) tra Committente e Professionista occasionale. Solo Candidatura.
        </p>
        <Link className="btn" href="/login">
          Entra nella demo
        </Link>
      </div>
    </div>
  )
}
