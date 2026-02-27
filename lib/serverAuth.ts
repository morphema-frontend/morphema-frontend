import type { UserMe } from '@/lib/types'

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://127.0.0.1:3000'

function normalizeOrigin(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed
}

function buildBackendUrl(path: string) {
  const origin = normalizeOrigin(BACKEND_ORIGIN)
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`
}

export async function fetchAuthUser(req: Request): Promise<{ status: number; user?: UserMe | null }> {
  const auth = req.headers.get('authorization')
  if (!auth) return { status: 401 }
  try {
    const res = await fetch(buildBackendUrl('/api/auth/me'), {
      headers: { Authorization: auth },
      cache: 'no-store',
    })
    if (!res.ok) return { status: res.status }
    const user = (await res.json()) as UserMe
    if (!user?.role) return { status: 401 }
    return { status: 200, user }
  } catch {
    return { status: 401 }
  }
}

export async function getAuthUserFromRequest(req: Request): Promise<UserMe | null> {
  const result = await fetchAuthUser(req)
  return result.status === 200 ? result.user ?? null : null
}
