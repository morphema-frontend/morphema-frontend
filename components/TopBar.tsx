'use client'

import Link from 'next/link'
import MorphemaLogo from '@/components/MorphemaLogo'
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
    <div className="mb-4 flex items-center justify-between border-b border-light px-4 py-3">
      <Link href="/" className="no-underline text-main">
        <MorphemaLogo />
      </Link>

      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-soft">
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
