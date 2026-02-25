'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { getStoredTokens } from '@/lib/api'

type UploadResult = {
  fileId: string
}

type UploadDropzoneProps = {
  label: string
  apiBase: string
  accept: string
  maxSizeMb: number
  onUploaded: (result: UploadResult) => void
}

function isImage(file: File) {
  return file.type.startsWith('image/')
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export default function UploadDropzone({
  label,
  apiBase,
  accept,
  maxSizeMb,
  onUploaded,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const maxBytes = maxSizeMb * 1024 * 1024

  const reset = useCallback(() => {
    setError(null)
    setProgress(0)
    setUploading(false)
  }, [])

  const handleFile = useCallback(
    (nextFile: File | null) => {
      reset()
      if (!nextFile) {
        setFile(null)
        setPreviewUrl(null)
        return
      }

      if (nextFile.size > maxBytes) {
        setError(`File troppo grande. Max ${maxSizeMb}MB.`)
        return
      }

      setFile(nextFile)
      if (isImage(nextFile)) {
        setPreviewUrl(URL.createObjectURL(nextFile))
      } else {
        setPreviewUrl(null)
      }
    },
    [maxBytes, maxSizeMb, reset],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const dropped = event.dataTransfer.files?.[0] || null
      handleFile(dropped)
    },
    [handleFile],
  )

  const handleUpload = useCallback(() => {
    if (!file) return
    setUploading(true)
    setError(null)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiBase}/files/upload`)

    const { accessToken } = getStoredTokens()
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const percent = Math.round((event.loaded / event.total) * 100)
      setProgress(percent)
    }

    xhr.onload = () => {
      setUploading(false)
      if (xhr.status < 200 || xhr.status >= 300) {
        setError(xhr.responseText || 'Upload fallito')
        return
      }
      try {
        const payload = JSON.parse(xhr.responseText)
        const fileId = String(payload?.file_id || payload?.fileId || payload?.id || '')
        if (!fileId) {
          setError('Upload completato ma file_id mancante')
          return
        }
        onUploaded({ fileId })
      } catch {
        setError('Risposta upload non valida')
      }
    }

    xhr.onerror = () => {
      setUploading(false)
      setError('Errore di rete durante upload')
    }

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  }, [apiBase, file, onUploaded])

  const fileLabel = useMemo(() => {
    if (!file) return 'Nessun file selezionato'
    return `${file.name} (${formatBytes(file.size)})`
  }, [file])

  return (
    <div className="rounded-xl border border-light bg-surface p-4">
      <div className="text-sm font-medium text-main">{label}</div>
      <div
        className="mt-3 flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-mid bg-base p-4 text-center text-sm text-soft"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover shadow" />
        ) : null}
        <div>{fileLabel}</div>
        <div className="text-xs text-soft">Drag & drop oppure seleziona un file.</div>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Scegli file
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(event) => handleFile(event.target.files?.[0] || null)}
        />
      </div>
      {error ? <div className="mt-3 text-xs text-red-600">{error}</div> : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-soft">Progress: {progress}%</div>
        <button className="btn" type="button" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Caricamento...' : 'Carica file'}
        </button>
      </div>
    </div>
  )
}
