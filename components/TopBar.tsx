'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { isVenueRole } from '@/lib/roles'

function roleLabel(role?: string) {
  if (role === 'worker') return 'Professionista occasionale'
  if (isVenueRole(role)) return 'Committente'
  return role || '-'
}

export default function TopBar() {
  const { user, signOut } = useAuth()

  return (
    <div className="mb-4 flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <div className="font-semibold">
        <Link href="/" className="no-underline">
          Morphema
        </Link>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-zinc-300">
              {user.email} ({roleLabel(user.role)})
            </span>
            <button className="btn" onClick={signOut}>
              Esci
            </button>
          </>
        ) : (
          <Link className="btn" href="/login">
            Entra
          </Link>
        )}
      </div>
    </div>
  )
}
