import { NextResponse } from 'next/server'
import { publishGig } from '@/lib/venueStore'
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
  const result = await publishGig(id, await auditContextFromRequest(req))
  if (!result) return NextResponse.json({ error: 'Gig non trovato' }, { status: 404 })
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 409 })
  return NextResponse.json(result)
}
