'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

type Props = {
  children: ReactNode
  allow?: Array<'admin' | 'horeca' | 'worker'>
}

export default function AuthGate({ children, allow }: Props) {
  const router = useRouter()
  const { user, loading, error } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (allow && !allow.includes(user.role as any)) {
      router.replace('/login')
    }
  }, [loading, user, allow, router])

  if (loading || !user) {
    return (
      <div className="p-6 text-sm text-soft">
        {error ? (
          <div className="space-y-2">
            <div>{error}</div>
            <button className="btn-secondary" type="button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          'Loading...'
        )}
      </div>
    )
  }

  return <>{children}</>
}
