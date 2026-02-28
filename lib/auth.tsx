'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { UserMe } from './types'
import { apiFetch, apiRequest, clearTokens, getApiBase, logApiConfig, storeTokens, type ApiResponse } from './api'
import { readReasonCode } from './gating'
import { logAuditClient } from './auditClient'

type FetchAuthFn = {
  (): Promise<void>
  (path: string, init?: RequestInit): Promise<Response>
}

type AuthContextValue = {
  user: UserMe | null
  me: UserMe | null

  loading: boolean
  error: string | null
  apiBase: string

  signIn: (
    email: string,
    password: string
  ) => Promise<ApiResponse<{ accessToken?: string; refreshToken?: string }>>
  signOut: () => void

  fetchAuth: FetchAuthFn
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = 'morphema_accessToken'

const AUTH_TIMEOUT_MS = 10000

function apiBaseFromEnv() {
  return getApiBase()
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function response401() {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'Content-Type': 'text/plain' },
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const apiBase = useMemo(apiBaseFromEnv, [])
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchAuth(): Promise<void>
  async function fetchAuth(path: string, init?: RequestInit): Promise<Response>
  async function fetchAuth(
    path?: string,
    init?: RequestInit
  ): Promise<void | Response> {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem(TOKEN_KEY)
        : null

    if (typeof path === 'string' && path.length > 0) {
      if (!token) return response401()

      const headers = new Headers(init?.headers || {})
      headers.set('Authorization', `Bearer ${token}`)

      return fetch(`${apiBase}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      })
    }

    setLoading(true)
    setError(null)

    try {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const res = await fetchWithTimeout(
        `${apiBase}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' },
        AUTH_TIMEOUT_MS
      )

      if (res.status === 403) {
        const reason = await readReasonCode(res)
        if (reason === 'role_mismatch') {
          setError('role_mismatch')
          setUser(null)
          return
        }
      }

      if (!res.ok) {
        clearTokens()
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('accessToken')
        setUser(null)
        return
      }

      const me = (await res.json()) as UserMe
      setUser(me)
    } catch (e: any) {
      setError(e?.message || 'Errore auth')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthStable = useCallback(
    ((path?: string, init?: RequestInit) =>
      fetchAuth(path as any, init)) as FetchAuthFn,
    [apiBase]
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiRequest<{ accessToken?: string; refreshToken?: string }>('/auth/login', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ email, password }),
        })
        if (!result.ok || !result.data?.accessToken) {
          const message = result.error?.message || 'Login fallito'
          setError(message)
          setUser(null)
          return result
        }

        if (result.data.refreshToken) storeTokens(result.data.accessToken, result.data.refreshToken)
        else localStorage.setItem(TOKEN_KEY, result.data.accessToken)
        await fetchAuthStable()
        await logAuditClient(
          { action: 'login', entityType: 'session', entityId: result.data?.accessToken || '' },
          null,
          { actorUserId: email, actorRole: 'unknown', actorEmail: email }
        )
        return result
      } catch (e: any) {
        setError(e?.message || 'Login fallito')
        setUser(null)
        return { ok: false, status: 500, data: null, error: { message: e?.message || 'Login fallito' } }
      } finally {
        setLoading(false)
      }
    },
    [apiBase, fetchAuthStable]
  )

  const signOut = useCallback(() => {
    if (user) {
      logAuditClient(
        { action: 'logout', entityType: 'session', entityId: String(user.sessionId || user.id) },
        user
      )
    }
    clearTokens()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [user])

  useEffect(() => {
    logApiConfig()
    fetchAuthStable()
  }, [fetchAuthStable])

  const value: AuthContextValue = {
    user,
    me: user,
    loading,
    error,
    apiBase,
    signIn,
    signOut,
    fetchAuth: fetchAuthStable,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
