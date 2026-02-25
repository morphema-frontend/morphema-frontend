'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import MorphemaLogo from '@/components/MorphemaLogo'
import { useAuth } from '@/lib/auth'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-1 text-sm no-underline ${
        active ? 'bg-blush text-main' : 'text-soft hover:bg-blush'
      }`}
    >
      {children}
    </Link>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <header className="border-b border-light bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="no-underline text-main">
              <MorphemaLogo />
            </Link>
            {user && <span className="badge">{user.role}</span>}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'horeca' && (
              <>
                <NavLink href="/venue">Dashboard</NavLink>
                <NavLink href="/venue/gigs/new">New Gig</NavLink>
              </>
            )}
            {user?.role === 'worker' && (
              <>
                <NavLink href="/worker/skills">Skills</NavLink>
                <NavLink href="/worker/gigs">Gigs</NavLink>
              </>
            )}
            {user ? (
              <button
                className="btn-secondary"
                onClick={() => {
                  signOut()
                  router.push('/login')
                }}
              >
                Logout
              </button>
            ) : (
              <NavLink href="/login">Login</NavLink>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
