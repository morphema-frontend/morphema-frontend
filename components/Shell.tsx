'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '@/lib/auth'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-1 text-sm no-underline ${active ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100'}`}
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
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="no-underline">
              <div className="text-lg font-semibold">Morphema</div>
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
