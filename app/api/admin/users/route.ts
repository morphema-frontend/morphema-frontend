import { NextResponse } from 'next/server'
import { listUsers } from '@/lib/userStore'
import { fetchAuthUser } from '@/lib/serverAuth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const auth = await fetchAuthUser(req)
  if (auth.status !== 200 || !auth.user) {
    const status = auth.status === 403 ? 403 : 401
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status })
  }
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = await listUsers()
  return NextResponse.json(users)
}
