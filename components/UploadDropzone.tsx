'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { getStoredTokens } from '@/lib/api'

type UploadResult = {
  fileId: string
  url: string
}

type UploadDropzoneProps = {
  label: string
  apiBase: string
  accept: string
  maxSizeMb: number
  uploaded?: UploadResult | null
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
  uploaded,
  onUploaded,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(uploaded ?? null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const maxBytes = maxSizeMb * 1024 * 1024
  const allowedMime = ['image/jpeg', 'image/png']
  const allowedExtensions = ['.jpg', '.jpeg', '.png']

  const reset = useCallback(() => {
    setError(null)
    setProgress(0)
    setUploading(false)
  }, [])

  const isAllowedFile = useCallback(
    (file: File) => {
      if (allowedMime.includes(file.type)) return true
      const lower = file.name.toLowerCase()
      return allowedExtensions.some((ext) => lower.endsWith(ext))
    },
    [allowedExtensions, allowedMime],
  )

  const handleFile = useCallback(
    (nextFile: File | null) => {
      reset()
      if (!nextFile) {
        setSelectedFile(null)
        setPreviewUrl(null)
        return
      }

      if (!isAllowedFile(nextFile)) {
        setError('Formato non supportato. Usa JPG o PNG.')
        return
      }

      if (nextFile.size > maxBytes) {
        setError(`File troppo grande. Max ${maxSizeMb}MB.`)
        return
      }

      setSelectedFile(nextFile)
      setUploadedFile(null)
      if (isImage(nextFile)) {
        setPreviewUrl(URL.createObjectURL(nextFile))
      } else {
        setPreviewUrl(null)
      }
    },
    [isAllowedFile, maxBytes, maxSizeMb, reset],
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
    if (!selectedFile) return
    setUploading(true)
    setError(null)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiBase}/uploads`)

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
        const fileId = String(payload?.fileId || payload?.file_id || payload?.id || '')
        const url = String(payload?.url || '')
        if (!fileId || !url) {
          setError('Upload completato ma risposta incompleta')
          return
        }
        const result = { fileId, url }
        setUploadedFile(result)
        setProgress(100)
        onUploaded(result)
      } catch {
        setError('Risposta upload non valida')
      }
    }

    xhr.onerror = () => {
      setUploading(false)
      setError('Errore di rete durante upload')
    }

    const form = new FormData()
    form.append('file', selectedFile)
    xhr.send(form)
  }, [apiBase, onUploaded, selectedFile])

  const fileLabel = useMemo(() => {
    if (!selectedFile) return 'Nessun file selezionato'
    return `${selectedFile.name} (${formatBytes(selectedFile.size)})`
  }, [selectedFile])

  const uploadStatus = uploadedFile ? 'Caricato' : 'Da caricare'

  React.useEffect(() => {
    if (uploaded?.fileId && uploaded?.url) {
      setUploadedFile((current) => {
        if (current?.fileId === uploaded.fileId && current?.url === uploaded.url) return current
        return uploaded
      })
      return
    }
    setUploadedFile(null)
  }, [uploaded?.fileId, uploaded?.url])

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
        <div className="text-xs text-soft">Formati: JPG/PNG - Max {maxSizeMb}MB</div>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Sfoglia
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
        <div className="text-xs text-soft">
          {uploading ? `Caricamento ${progress}%` : `Stato: ${uploadStatus}`}
          {uploadedFile?.url ? ` - ${uploadedFile.url}` : ''}
        </div>
        <button className="btn" type="button" onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? 'Caricamento...' : 'Carica file'}
        </button>
      </div>
    </div>
  )
}
