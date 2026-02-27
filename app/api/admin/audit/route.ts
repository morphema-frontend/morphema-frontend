import { NextResponse } from 'next/server'
import { listAudit } from '@/lib/auditStore'
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
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') || '50')
  const cursor = searchParams.get('cursor')
  const data = await listAudit({
    limit,
    cursor,
    action: searchParams.get('action'),
    actorUserId: searchParams.get('actorUserId'),
    entityType: searchParams.get('entityType'),
    entityId: searchParams.get('entityId'),
    fromTs: searchParams.get('from'),
    toTs: searchParams.get('to'),
    q: searchParams.get('q'),
  })
  return NextResponse.json(data)
}
