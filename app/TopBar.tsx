'use client'

import Link from 'next/link'
import MorphemaLogo from '@/components/MorphemaLogo'
import { useAuth } from '@/lib/auth'

export default function TopBar() {
  const { user, signOut } = useAuth()
  const roleLabel =
    user?.role === 'worker'
      ? 'Professionista occasionale'
      : user?.role === 'horeca' || user?.role === 'admin'
        ? 'Committente'
        : null

  return (
    <div className="flex items-center justify-between border-b border-light px-4 py-3">
      <Link href="/" className="no-underline text-main">
        <MorphemaLogo />
      </Link>

      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-soft">
              {user.email}{roleLabel ? ` (${roleLabel})` : ''}
            </span>
            <button className="btn" onClick={signOut}>Logout</button>
          </>
        ) : (
          <Link className="btn" href="/login">Login</Link>
        )}
      </div>
    </div>
  )
}
