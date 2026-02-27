import http from 'http'
import { readFileSync } from 'fs'
import path from 'path'
import request from 'supertest'
import { AuditService } from '@/lib/auditStore'
import * as adminAuditRoute from '@/app/api/admin/audit/route'
import * as proxyRoute from '@/app/api/[...path]/route'

function readAuditLog() {
  const dir = process.env.AUDIT_DATA_DIR || path.join(process.cwd(), 'data')
  const file = path.join(dir, 'audit.json')
  try {
    const raw = readFileSync(file, 'utf-8')
    return JSON.parse(raw) as any[]
  } catch {
    return []
  }
}

async function readBody(req: http.IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  if (chunks.length === 0) return undefined
  return Buffer.concat(chunks)
}

function createTestServer() {
  return http.createServer(async (req, res) => {
    try {
      const method = (req.method || 'GET').toUpperCase()
      const url = new URL(req.url || '/', 'http://localhost')
      const headers = new Headers()
      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue
        if (Array.isArray(value)) headers.set(key, value.join(','))
        else headers.set(key, value)
      }
      const body = await readBody(req)
      const requestInit: RequestInit = { method, headers }
      if (body && method !== 'GET' && method !== 'HEAD') requestInit.body = body
      const requestObj = new Request(url.toString(), requestInit)

      let response: Response
      if (url.pathname === '/api/admin/audit' && method === 'GET') {
        response = await adminAuditRoute.GET(requestObj)
      } else if (url.pathname.startsWith('/api/')) {
        const pathParts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
        const handler = (proxyRoute as any)[method]
        response = await handler(requestObj, { params: { path: pathParts } })
      } else {
        response = new Response('Not Found', { status: 404 })
      }

      res.statusCode = response.status
      response.headers.forEach((value, key) => res.setHeader(key, value))
      const out = Buffer.from(await response.arrayBuffer())
      res.end(out)
    } catch (err: any) {
      res.statusCode = 500
      res.end(err?.message || 'Server error')
    }
  })
}

describe('Audit + admin endpoints', () => {
  it('logs register and login via proxy routes', async () => {
    ;(global.fetch as any) = jest.fn(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const server = createTestServer()
    const agent = request(server)
    await agent
      .post('/api/auth/register')
      .send({ email: 'worker@example.com', password: 'Password123!' })
      .expect(200)
    await agent
      .post('/api/auth/login')
      .send({ email: 'worker@example.com', password: 'Password123!' })
      .expect(200)

    const items = readAuditLog()
    const actions = items.map((entry) => entry.action)
    expect(actions).toContain('register')
    expect(actions).toContain('login')
    server.close()
  })

  it('requires admin role for audit endpoint', async () => {
    const server = createTestServer()
    const agent = request(server)

    ;(global.fetch as any) = jest.fn(async () => {
      return new Response('Unauthorized', { status: 401 })
    })
    await agent.get('/api/admin/audit').expect(401)

    ;(global.fetch as any) = jest.fn(async () => {
      return new Response(JSON.stringify({ id: 2, email: 'user@example.com', role: 'worker' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    await agent.get('/api/admin/audit').set('Authorization', 'Bearer token').expect(403)

    server.close()
  })

  it('returns paginated audit entries with cursor', async () => {
    ;(global.fetch as any) = jest.fn(async (input: any) => {
      const url = String(input)
      if (url.endsWith('/api/auth/me')) {
        return new Response(JSON.stringify({ id: 1, email: 'admin@example.com', role: 'admin' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('Not found', { status: 404 })
    })

    await AuditService.log({
      actorUserId: '1',
      actorRole: 'admin',
      action: 'test_a',
      entityType: 'gig',
      entityId: '1',
      payload: {},
      ip: '127.0.0.1',
      userAgent: 'jest',
    })
    await AuditService.log({
      actorUserId: '1',
      actorRole: 'admin',
      action: 'test_b',
      entityType: 'gig',
      entityId: '2',
      payload: {},
      ip: '127.0.0.1',
      userAgent: 'jest',
    })
    await AuditService.log({
      actorUserId: '1',
      actorRole: 'admin',
      action: 'test_c',
      entityType: 'gig',
      entityId: '3',
      payload: {},
      ip: '127.0.0.1',
      userAgent: 'jest',
    })

    const server = createTestServer()
    const agent = request(server)

    const first = await agent.get('/api/admin/audit?limit=2').set('Authorization', 'Bearer token').expect(200)
    expect(first.body.items.length).toBe(2)
    expect(first.body.nextCursor).toBeTruthy()

    const nextCursor = first.body.nextCursor
    const second = await agent
      .get(`/api/admin/audit?limit=2&cursor=${encodeURIComponent(nextCursor)}`)
      .set('Authorization', 'Bearer token')
      .expect(200)
    expect(second.body.items.length).toBeGreaterThan(0)
    expect(second.body.items[0].id).not.toBe(first.body.items[0].id)

    server.close()
  })
})
