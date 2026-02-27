import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { AuditService, auditContextFromRequest } from '@/lib/auditStore'

export const runtime = 'nodejs'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png'])

function extFromFile(file: File) {
  const ext = path.extname(file.name || '').toLowerCase()
  if (ALLOWED_EXT.has(ext)) return ext
  if (file.type === 'image/jpeg') return '.jpg'
  if (file.type === 'image/png') return '.png'
  return ''
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File mancante' }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'File vuoto' }, { status: 400 })
    }

    const ext = extFromFile(file)
    if (!ext || (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.has(ext))) {
      return NextResponse.json({ error: 'Formato non supportato. Usa JPG o PNG.' }, { status: 415 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File troppo grande' }, { status: 413 })
    }

    const fileId = crypto.randomUUID()
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const fileName = `${fileId}${ext}`
    const target = path.join(uploadsDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(target, buffer)

    const ctx = await auditContextFromRequest(req)
    await AuditService.log({
      ...ctx,
      action: 'upload',
      entityType: 'upload',
      entityId: fileId,
      payload: { fileName, size: file.size, mime: file.type },
    })
    return NextResponse.json({ fileId, url: `/uploads/${fileName}` }, { status: 201 })
  } catch (error) {
    console.error('Upload failed', error)
    return NextResponse.json({ error: 'Upload fallito' }, { status: 500 })
  }
}
