import { NextResponse } from 'next/server'
import { acceptApplication } from '@/lib/venueStore'
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
  const updated = await acceptApplication(id, await auditContextFromRequest(req))
  if (!updated) return NextResponse.json({ error: 'Candidatura non trovata' }, { status: 404 })
  if ('error' in updated) return NextResponse.json({ error: updated.error }, { status: 409 })
  return NextResponse.json(updated)
}
