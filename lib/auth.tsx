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
import { apiFetch, clearTokens, getApiBase, storeTokens } from './api'

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

  signIn: (email: string, password: string) => Promise<void>
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
        const data = await apiFetch<{ accessToken?: string; refreshToken?: string }>('/auth/login', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ email, password }),
        })
        if (!data?.accessToken) throw new Error('Login fallito')

        if (data.refreshToken) storeTokens(data.accessToken, data.refreshToken)
        else localStorage.setItem(TOKEN_KEY, data.accessToken)
        await fetchAuthStable()
      } catch (e: any) {
        setError(e?.message || 'Login fallito')
        setUser(null)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [apiBase, fetchAuthStable]
  )

  const signOut = useCallback(() => {
    clearTokens()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  useEffect(() => {
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
