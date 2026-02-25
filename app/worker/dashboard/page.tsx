'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/lib/auth'

export default function WorkerDashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/worker/auth/login')
  }, [loading, user, router])

  if (loading) return <div className="mx-auto mt-20 max-w-md card">Loading...</div>
  if (!user) return <div className="mx-auto mt-20 max-w-md card">Redirecting...</div>

  return (
    <div className="mx-auto max-w-5xl px-4">
      <TopBar />
      <div className="card">
        <div className="badge">Worker</div>
        <h1 className="mt-3 text-xl font-semibold text-main">Dashboard</h1>
        <p className="mt-2 text-sm text-soft">Status: profile completed.</p>
      </div>
    </div>
  )
}
