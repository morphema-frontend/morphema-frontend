import { NextResponse } from 'next/server'
import { AuditService, auditContextFromRequest } from '@/lib/auditStore'

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://127.0.0.1:3000'

function normalizeOrigin(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
export const runtime = 'nodejs'

async function handler(req: Request, ctx: { params: { path: string[] } }) {
  const path = (ctx.params.path || []).join('/')
  const incomingUrl = new URL(req.url)
  const origin = normalizeOrigin(BACKEND_ORIGIN)
  const url = `${origin}/api${path ? `/${path}` : ''}${incomingUrl.search}`
  const isAuthRoute = path.startsWith('auth')

  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length')

  const method = req.method.toUpperCase()
  const hasBody = !['GET', 'HEAD'].includes(method)
  const bodyBuffer = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined

  const upstream = await fetch(url, {
    method,
    headers,
    body: bodyBuffer,
    redirect: 'manual',
    cache: isAuthRoute ? 'no-store' : 'default',
  })

  const resHeaders = new Headers(upstream.headers)
  // Same-origin: togli CORS headers per evitare conflitti strani
  resHeaders.delete('access-control-allow-origin')
  resHeaders.delete('access-control-allow-credentials')
  resHeaders.delete('access-control-allow-headers')
  resHeaders.delete('access-control-allow-methods')

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  })

  const getSetCookie = (upstream.headers as any).getSetCookie
  const setCookies: string[] | undefined = typeof getSetCookie === 'function' ? getSetCookie.call(upstream.headers) : undefined
  if (setCookies && setCookies.length) {
    res.headers.delete('set-cookie')
    setCookies.forEach((cookie) => res.headers.append('set-cookie', cookie))
  } else {
    const fallbackCookie = upstream.headers.get('set-cookie')
    if (fallbackCookie) {
      res.headers.set('set-cookie', fallbackCookie)
    }
  }

  const shouldAudit =
    path.startsWith('auth/login') ||
    path.startsWith('auth/register') ||
    path.startsWith('auth/logout') ||
    path.startsWith('auth/refresh') ||
    path.startsWith('worker/onboarding/submit') ||
    path.startsWith('venue/onboarding/submit')

  if (shouldAudit && upstream.ok) {
    const ctx = await auditContextFromRequest(req)
    let parsedBody: any = null
    if (bodyBuffer && req.headers.get('content-type')?.includes('application/json')) {
      try {
        parsedBody = JSON.parse(bodyBuffer.toString('utf-8'))
      } catch {
        parsedBody = null
      }
    }

    let action = 'unknown'
    let entityType = 'unknown'
    let entityId: string | number | undefined

    if (path.startsWith('auth/register')) {
      action = 'register'
      entityType = 'user'
      entityId = parsedBody?.email || ctx.actorUserId
    } else if (path.startsWith('auth/login')) {
      action = 'login'
      entityType = 'session'
      entityId = parsedBody?.email || ctx.actorUserId
    } else if (path.startsWith('auth/logout')) {
      action = 'logout'
      entityType = 'session'
      entityId = ctx.actorUserId
    } else if (path.startsWith('auth/refresh')) {
      action = 'refresh'
      entityType = 'session'
      entityId = ctx.actorUserId
    } else if (path.startsWith('worker/onboarding/submit')) {
      action = 'onboarding_submit'
      entityType = 'worker'
      entityId = ctx.actorUserId
    } else if (path.startsWith('venue/onboarding/submit')) {
      action = 'onboarding_submit'
      entityType = 'venue'
      entityId = ctx.actorUserId
    }

    await AuditService.log({
      ...ctx,
      action,
      entityType,
      entityId,
      payload: parsedBody ?? {},
    })
  }

  return res
}
