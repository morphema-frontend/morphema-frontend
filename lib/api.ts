import type { AuthResult } from './types'

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000/api'

export class ApiError extends Error {
  status: number
  payload: any
  constructor(status: number, message: string, payload?: any) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export function getStoredTokens() {
  if (typeof window === 'undefined') return { accessToken: null as string | null, refreshToken: null as string | null }
  return {
    accessToken: localStorage.getItem('morphema_accessToken'),
    refreshToken: localStorage.getItem('morphema_refreshToken'),
  }
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('morphema_accessToken', accessToken)
  localStorage.setItem('morphema_refreshToken', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('morphema_accessToken')
  localStorage.removeItem('morphema_refreshToken')
}

async function parseJsonSafe(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export async function apiFetch<T>(path: string, opts: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, ...init } = opts
  const headers = new Headers(init.headers || {})
  headers.set('Content-Type', 'application/json')

  if (auth) {
    const { accessToken } = getStoredTokens()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!res.ok) {
    const payload = await parseJsonSafe(res)
    const message = (payload && (payload.message || payload.error)) || res.statusText || 'Request failed'
    throw new ApiError(res.status, message, payload)
  }

  return (await parseJsonSafe(res)) as T
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/refresh', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ refreshToken }),
  })
}
