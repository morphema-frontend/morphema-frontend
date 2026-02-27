import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

export type AdminUser = {
  id: string
  email?: string
  role?: string
  disabled: boolean
  createdAt: string
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

async function readUsers(): Promise<AdminUser[]> {
  try {
    const raw = await readFile(USERS_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeUsers(users: AdminUser[]) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

export async function upsertUser(input: { id: string; email?: string; role?: string }) {
  const users = await readUsers()
  const idx = users.findIndex((u) => u.id === input.id)
  const now = new Date().toISOString()
  if (idx === -1) {
    const next: AdminUser = {
      id: input.id,
      email: input.email,
      role: input.role,
      disabled: false,
      createdAt: now,
      updatedAt: now,
    }
    users.push(next)
    await writeUsers(users)
    return next
  }
  const existing = users[idx]
  const updated: AdminUser = {
    ...existing,
    email: input.email ?? existing.email,
    role: input.role ?? existing.role,
    updatedAt: now,
  }
  users[idx] = updated
  await writeUsers(users)
  return updated
}

export async function listUsers() {
  return readUsers()
}

export async function disableUser(id: string) {
  const users = await readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return null
  const now = new Date().toISOString()
  users[idx] = { ...users[idx], disabled: true, updatedAt: now }
  await writeUsers(users)
  return users[idx]
}
