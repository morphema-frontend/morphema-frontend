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
  const { me, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!me) {
      router.replace('/login')
      return
    }
    if (roles && roles.length && !roles.includes(me.role as Role)) {
      router.replace('/')
    }
  }, [loading, me, roles, router])

  if (loading) return <div className="card">Loading…</div>
  if (!me) return null
  if (roles && roles.length && !roles.includes(me.role as Role)) return null

  return <>{children}</>
}
