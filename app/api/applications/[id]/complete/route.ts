import { NextResponse } from 'next/server'
import { completeApplication } from '@/lib/venueStore'
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
  const ctx = await auditContextFromRequest(req)
  const result = await completeApplication(id, ctx.actorUserId || 'unknown', ctx)
  if (!result) return NextResponse.json({ error: 'Candidatura non trovata' }, { status: 404 })
  if ('error' in result) {
    const status = (result as any).status || 409
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json(result)
}
