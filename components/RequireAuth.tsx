'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import type { Role } from '@/lib/types'

export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[]
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      if (roles?.includes('worker') && !roles?.includes('horeca')) {
        router.replace('/worker/auth/login')
      } else if (roles?.includes('horeca') || roles?.includes('admin') || roles?.includes('venue')) {
        router.replace('/venue/auth/login')
      } else {
        router.replace('/login')
      }
      return
    }
    if (roles && roles.length && !roles.includes(user.role as Role)) {
      router.replace('/')
    }
  }, [loading, user, roles, router])

  if (loading) return <div className="card">Loading…</div>
  if (!user) return null
  if (roles && roles.length && !roles.includes(user.role as Role)) return null

  return <>{children}</>
}
