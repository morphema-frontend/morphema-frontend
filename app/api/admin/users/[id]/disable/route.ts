import { NextResponse } from 'next/server'
import { disableUser } from '@/lib/userStore'
import { fetchAuthUser } from '@/lib/serverAuth'

export const runtime = 'nodejs'

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const auth = await fetchAuthUser(req)
  if (auth.status !== 200 || !auth.user) {
    const status = auth.status === 403 ? 403 : 401
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status })
  }
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const id = String(ctx.params.id || '')
  if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
  const user = await disableUser(id)
  if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
  return NextResponse.json(user)
}
