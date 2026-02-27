import { NextResponse } from 'next/server'
import { listPublishedGigs } from '@/lib/venueStore'

export const runtime = 'nodejs'

function requireAuth(req: Request) {
  const auth = req.headers.get('authorization')
  return Boolean(auth)
}

export async function GET(req: Request) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const gigs = await listPublishedGigs()
  return NextResponse.json(gigs)
}
