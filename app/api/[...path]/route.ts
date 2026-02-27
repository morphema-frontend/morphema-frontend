import { NextResponse } from 'next/server'

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

  const upstream = await fetch(url, {
    method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
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

  return res
}
