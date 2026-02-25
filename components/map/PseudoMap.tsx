import type { Gig } from '@/lib/types'

export function PseudoMap({ gigs }: { gigs: Gig[] }) {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-xl border border-light bg-base p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-soft">
        <span>Map preview</span>
        <span>{gigs.length} gigs</span>
      </div>
      <svg viewBox="0 0 400 240" width="100%" height="100%" role="img" aria-label="Map preview">
        <rect x="0" y="0" width="400" height="240" rx="18" fill="#F8F8F8" />
        <path d="M30 90 L100 70 L170 90 L240 70 L320 90 L360 130 L300 170 L210 150 L130 170 L60 140 Z" fill="#E8E8E8" />
        <path d="M70 100 L130 90 L190 110 L250 100 L310 120" stroke="#D8D8D8" strokeWidth="4" fill="none" />
        <circle cx="110" cy="120" r="6" fill="#A0F8F8" />
        <circle cx="190" cy="140" r="6" fill="#A0F8F8" />
        <circle cx="270" cy="125" r="6" fill="#A0F8F8" />
        <circle cx="230" cy="170" r="6" fill="#A0F8F8" />
      </svg>
    </div>
  )
}
