import { NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000/api'

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler

async function handler(req: Request, ctx: { params: { path: string[] } }) {
  const path = (ctx.params.path || []).join('/')
  const incomingUrl = new URL(req.url)
  const url = `${BACKEND}/${path}${incomingUrl.search}`

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
  })

  const resHeaders = new Headers(upstream.headers)
  // Same-origin: togli CORS headers per evitare conflitti strani
  resHeaders.delete('access-control-allow-origin')
  resHeaders.delete('access-control-allow-credentials')
  resHeaders.delete('access-control-allow-headers')
  resHeaders.delete('access-control-allow-methods')

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  })
}
