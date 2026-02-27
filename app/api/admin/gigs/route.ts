import { NextResponse } from 'next/server'
import { listGigs } from '@/lib/venueStore'
import { fetchAuthUser } from '@/lib/serverAuth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const auth = await fetchAuthUser(req)
  if (auth.status !== 200 || !auth.user) {
    const status = auth.status === 403 ? 403 : 401
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status })
  }
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const gigs = await listGigs()
  return NextResponse.json(gigs)
}
