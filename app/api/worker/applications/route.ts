import { NextResponse } from 'next/server'
import { listWorkerApplications } from '@/lib/venueStore'

export const runtime = 'nodejs'

function requireAuth(req: Request) {
  const auth = req.headers.get('authorization')
  return Boolean(auth)
}

function actorFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || ''
  return auth.replace(/^Bearer\s+/i, '') || 'unknown'
}

export async function GET(req: Request) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const workerId = actorFromRequest(req)
  const apps = await listWorkerApplications(workerId)
  return NextResponse.json(apps)
}
