import { NextResponse } from 'next/server'
import { AuditService, auditContextFromRequest } from '@/lib/auditStore'
import { upsertUser } from '@/lib/userStore'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ctx = await auditContextFromRequest(req)
    const actorUserId = String(body?.actorUserId ?? ctx.actorUserId ?? 'unknown')
    const actorRole = String(body?.actorRole ?? ctx.actorRole ?? 'unknown')
    const actorEmail = body?.actorEmail || req.headers.get('x-actor-email') || undefined

    if (actorUserId && actorUserId !== 'unknown') {
      await upsertUser({ id: actorUserId, email: actorEmail, role: actorRole })
    }

    await AuditService.log({
      actorUserId,
      actorRole,
      action: String(body?.action || 'unknown'),
      entityType: String(body?.entityType || 'unknown'),
      entityId: body?.entityId,
      payload: body?.payload ?? {},
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }
}
