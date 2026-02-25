import type { Gig } from '@/lib/types'

export function GigMap({ gigs }: { gigs: Gig[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Map</div>
          <div className="mt-1 text-xs text-soft">Preview only (no external tiles).</div>
        </div>
        <span className="badge">{gigs.length} gigs</span>
      </div>
      <div className="mt-3 h-[260px] overflow-hidden rounded-xl border border-light bg-base p-4">
        <svg viewBox="0 0 400 200" width="100%" height="100%" role="img" aria-label="Map preview">
          <rect x="0" y="0" width="400" height="200" rx="18" fill="#F8F8F8" />
          <path d="M40 60 L140 40 L220 70 L320 50 L360 80 L300 120 L200 110 L120 140 L60 110 Z" fill="#E8E8E8" />
          <path d="M80 70 L120 60 L180 85 L240 75 L300 95" stroke="#D8D8D8" strokeWidth="4" fill="none" />
          <circle cx="120" cy="90" r="6" fill="#A0F8F8" />
          <circle cx="200" cy="105" r="6" fill="#A0F8F8" />
          <circle cx="280" cy="95" r="6" fill="#A0F8F8" />
          <circle cx="160" cy="130" r="6" fill="#A0F8F8" />
        </svg>
      </div>
    </div>
  )
}
