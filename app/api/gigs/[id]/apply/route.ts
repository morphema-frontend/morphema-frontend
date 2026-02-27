import { NextResponse } from 'next/server'
import { applyToGig } from '@/lib/venueStore'
import { auditContextFromRequest } from '@/lib/auditStore'

export const runtime = 'nodejs'

function requireAuth(req: Request) {
  const auth = req.headers.get('authorization')
  return Boolean(auth)
}

function parseId(idValue: string) {
  const parsed = Number(idValue)
  return Number.isFinite(parsed) ? parsed : null
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = parseId(ctx.params.id)
  if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
  try {
    const body = await req.json()
    const workerName = String(body?.workerName || 'Worker')
    const ctx = await auditContextFromRequest(req)
    const workerId = ctx.actorUserId || 'unknown'
    const result = await applyToGig(id, workerId, workerName, ctx)
    if ('error' in result) {
      const status = (result as any).status || 409
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }
}
