import { NextResponse } from 'next/server'
import { createGig, listGigs } from '@/lib/venueStore'
import { auditContextFromRequest } from '@/lib/auditStore'

export const runtime = 'nodejs'

function requireAuth(req: Request) {
  const auth = req.headers.get('authorization')
  return Boolean(auth)
}

export async function GET(req: Request) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const gigs = await listGigs()
  return NextResponse.json(gigs)
}

export async function POST(req: Request) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const title = String(body?.title || '').trim()
    const payAmount = Number(body?.payAmount || 0)
    const currency = String(body?.currency || 'EUR')
    if (!title) {
      return NextResponse.json({ error: 'Titolo richiesto' }, { status: 400 })
    }
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'Compenso non valido' }, { status: 400 })
    }
    const created = await createGig(
      {
        title,
        payAmount,
        currency,
        startTime: body?.startTime,
        endTime: body?.endTime,
        venueId: body?.venueId ?? null,
      },
      await auditContextFromRequest(req),
    )
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }
}
