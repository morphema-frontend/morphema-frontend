import { NextResponse } from 'next/server'
import { deleteGig, updateGig } from '@/lib/venueStore'
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

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = parseId(ctx.params.id)
  if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
  try {
    const body = await req.json()
    const patch: any = {}
    if (typeof body?.title === 'string') patch.title = body.title
    if (body?.payAmount !== undefined) patch.payAmount = Number(body.payAmount)
    if (typeof body?.currency === 'string') patch.currency = body.currency
    if (typeof body?.startTime === 'string') patch.startTime = body.startTime
    if (typeof body?.endTime === 'string') patch.endTime = body.endTime

    const updated = await updateGig(id, patch, await auditContextFromRequest(req))
    if (!updated) return NextResponse.json({ error: 'Gig non trovato' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = parseId(ctx.params.id)
  if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
  const ok = await deleteGig(id, await auditContextFromRequest(req))
  if (!ok) return NextResponse.json({ error: 'Gig non trovato' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
