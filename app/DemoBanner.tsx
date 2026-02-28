type DisclaimerPayload = {
  text?: string
  disclaimer?: string
  message?: string
}

const FALLBACK_DISCLAIMER =
  "Prestazione autonoma (art. 2222 c.c.). Il lavoratore e' responsabile degli adempimenti fiscali. Nessuna consulenza legale/fiscale."

async function loadDisclaimer() {
  const { headers } = await import('next/headers')
  const hdrs = headers()
  const proto = hdrs.get('x-forwarded-proto') || 'http'
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host')
  const origin = host ? `${proto}://${host}` : null
  const apiBase = origin ? `${origin}/api` : 'http://127.0.0.1:3000/api'
  try {
    const res = await fetch(`${apiBase}/compliance/disclaimer`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const text = await res.text()
    if (!text) return null
    try {
      const json = JSON.parse(text) as DisclaimerPayload | string
      if (typeof json === 'string') return json
      if (json?.disclaimer) return String(json.disclaimer)
      if (json?.text) return String(json.text)
      if (json?.message) return String(json.message)
    } catch {
      return text
    }
    return text
  } catch {
    return null
  }
}

export default async function DemoBanner() {
  const disclaimer = (await loadDisclaimer()) || FALLBACK_DISCLAIMER
  const commit = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || ''
  const version = process.env.NEXT_PUBLIC_APP_VERSION || ''
  const buildLabel = version ? `v${version}` : 'v?'
  const shaLabel = commit ? commit.slice(0, 7) : 'local'

  return (
    <div className="w-full border-b border-light bg-base px-4 py-2 text-sm text-soft shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
        <span className="font-medium text-main">Demo</span>
        <span>{disclaimer}</span>
        <span className="ml-auto text-xs text-soft">
          API {process.env.NEXT_PUBLIC_API_BASE_URL || '/api'} - {buildLabel} ({shaLabel})
        </span>
      </div>
    </div>
  )
}
